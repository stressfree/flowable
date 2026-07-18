import { useState } from 'react';
import { toast } from 'sonner';
import { useSpawnForm, useSpawn, useBundleEvents, useSendEvent } from '@/api/bundles';
import type { SpawnVariable } from '@/types';

interface SpawnFormProps {
  bundleId: number;
}

function isNumericType(type: string): boolean {
  return type === 'number' || type === 'double' || type === 'integer' || type === 'long';
}

function VariableInput({
  variable,
  value,
  onChange,
}: {
  variable: SpawnVariable;
  value: string;
  onChange: (value: string) => void;
}) {
  const baseClass =
    'w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent';

  if (variable.type === 'boolean') {
    return (
      <select value={value || 'false'} onChange={(e) => onChange(e.target.value)} className={baseClass}>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  if (isNumericType(variable.type)) {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={variable.type === 'double' ? '0.01' : '1'}
        className={baseClass}
        placeholder={`Enter ${variable.label || variable.name}`}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={baseClass}
      placeholder={`Enter ${variable.label || variable.name}`}
    />
  );
}

export function SpawnForm({ bundleId }: SpawnFormProps) {
  const { data: spawnForm, isLoading } = useSpawnForm(bundleId);
  const spawnMutation = useSpawn(bundleId);
  const { data: events } = useBundleEvents(bundleId);
  const sendEventMutation = useSendEvent(bundleId);

  const [variables, setVariables] = useState<Record<string, string>>({});
  const [jsonInput, setJsonInput] = useState('{}');
  const [instanceId, setInstanceId] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventPayload, setEventPayload] = useState<Record<string, string>>({});
  const [eventResult, setEventResult] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-[#e5e7eb] p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-100 rounded w-48"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  function parseValue(raw: string, type: string): unknown {
    if (type === 'boolean') return raw === 'true';
    if (isNumericType(type)) return raw === '' ? 0 : Number(raw);
    return raw;
  }

  function handleSpawn() {
    let payload: Record<string, unknown>;

    if (spawnForm && spawnForm.variables.length > 0) {
      payload = {};
      for (const v of spawnForm.variables) {
        payload[v.name] = parseValue(variables[v.name] ?? '', v.type);
      }
    } else {
      try {
        payload = JSON.parse(jsonInput);
      } catch {
        toast.error('Invalid JSON in variable input');
        return;
      }
    }

    spawnMutation.mutate(payload, {
      onSuccess: (result) => {
        setInstanceId(result.instanceId);
        toast.success(`Process instance started: ${result.instanceId}`);
      },
      onError: (error: unknown) => {
        const apiError = error as { detail?: string; title?: string };
        toast.error(apiError.detail || apiError.title || 'Failed to spawn process');
      },
    });
  }

  function handleSendEvent() {
    if (!selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    const payload: Record<string, unknown> = {};
    const event = events?.find((e) => e.eventKey === selectedEvent);
    if (event) {
      for (const param of [...event.correlationParameters, ...event.payload]) {
        payload[param.name] = parseValue(eventPayload[param.name] ?? '', param.type);
      }
    }

    sendEventMutation.mutate(
      { eventKey: selectedEvent, payload },
      {
        onSuccess: (result) => {
          setEventResult(`Event sent: ${result.status}`);
          toast.success(`Event "${selectedEvent}" sent successfully`);
        },
        onError: (error: unknown) => {
          const apiError = error as { detail?: string; title?: string };
          toast.error(apiError.detail || apiError.title || 'Failed to send event');
        },
      },
    );
  }

  const selectedEventDef = events?.find((e) => e.eventKey === selectedEvent);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-[#e5e7eb] p-6">
        <h2 className="text-sm font-semibold text-[#111827] mb-4">Process Variables</h2>

        {spawnForm && spawnForm.variables.length > 0 ? (
          <div className="space-y-3">
            {spawnForm.variables.map((v) => (
              <div key={v.name}>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  {v.label || v.name}
                  <span className="text-[#9ca3af] ml-1">({v.type})</span>
                  {v.required && <span className="text-[#dc2626] ml-1">*</span>}
                </label>
                <VariableInput
                  variable={v}
                  value={variables[v.name] ?? ''}
                  onChange={(val) => setVariables((prev) => ({ ...prev, [v.name]: val }))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Variables (JSON)</label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent resize-none"
              placeholder='{"key": "value"}'
            />
            <p className="mt-1 text-xs text-[#9ca3af]">No form variables detected. Enter JSON manually.</p>
          </div>
        )}

        {instanceId && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-emerald-800">Process instance started</p>
              <p className="text-xs text-emerald-700 font-mono">Instance ID: {instanceId}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSpawn}
          disabled={spawnMutation.isPending}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#4f46e5] rounded-md hover:bg-indigo-600 disabled:opacity-50"
        >
          {spawnMutation.isPending ? 'Starting...' : 'Start Process Instance'}
        </button>
      </div>

      {events && events.length > 0 && (
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-6">
          <h2 className="text-sm font-semibold text-[#111827] mb-4">Send Test Event</h2>

          <div className="mb-3">
            <label className="block text-sm font-medium text-[#374151] mb-1">Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value);
                setEventPayload({});
                setEventResult(null);
              }}
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            >
              <option value="">Select an event...</option>
              {events.map((event) => (
                <option key={event.eventKey} value={event.eventKey}>
                  {event.eventName} ({event.eventKey})
                </option>
              ))}
            </select>
          </div>

          {selectedEventDef && (() => {
            const allParams = [...selectedEventDef.correlationParameters, ...selectedEventDef.payload];
            if (allParams.length === 0) {
              return <p className="text-sm text-[#9ca3af]">This event has no parameters.</p>;
            }
            return (
              <div className="space-y-3">
                {selectedEventDef.correlationParameters.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Correlation Parameters</p>
                    {selectedEventDef.correlationParameters.map((param) => (
                      <div key={param.name} className="mb-2">
                        <label className="block text-sm font-medium text-[#374151] mb-1">
                          {param.name}<span className="text-[#9ca3af] ml-1">({param.type})</span>
                        </label>
                        <input
                          type={isNumericType(param.type) ? 'number' : 'text'}
                          value={eventPayload[param.name] ?? ''}
                          onChange={(e) => setEventPayload((prev) => ({ ...prev, [param.name]: e.target.value }))}
                          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {selectedEventDef.payload.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Payload</p>
                    {selectedEventDef.payload.map((param) => (
                      <div key={param.name} className="mb-2">
                        <label className="block text-sm font-medium text-[#374151] mb-1">
                          {param.name}<span className="text-[#9ca3af] ml-1">({param.type})</span>
                        </label>
                        <input
                          type={isNumericType(param.type) ? 'number' : 'text'}
                          value={eventPayload[param.name] ?? ''}
                          onChange={(e) => setEventPayload((prev) => ({ ...prev, [param.name]: e.target.value }))}
                          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {eventResult && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-md p-3">
              <p className="text-sm text-emerald-800">{eventResult}</p>
            </div>
          )}

          <button
            onClick={handleSendEvent}
            disabled={!selectedEvent || sendEventMutation.isPending}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#4f46e5] rounded-md hover:bg-indigo-600 disabled:opacity-50"
          >
            {sendEventMutation.isPending ? 'Sending...' : 'Send Event'}
          </button>
        </div>
      )}
    </div>
  );
}
