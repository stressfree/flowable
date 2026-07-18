async function globalTeardown() {
  console.log('[Global Teardown] Cleaning up...');

  // Optionally clean up seeded data by deleting companies (cascades to bundles)
  // For now, we leave data in place for debugging. Uncomment to enable cleanup:
  // try {
  //   execSync('curl -s http://localhost:8080/v1/companies | python3 -c "import sys,json; [print(c[\'id\']) for c in json.load(sys.stdin)]" | xargs -I{} curl -X DELETE http://localhost:8080/v1/companies/{}', {
  //     stdio: 'inherit',
  //   });
  // } catch {
  //   console.log('[Global Teardown] Cleanup skipped (non-critical)');
  // }

  console.log('[Global Teardown] Done.');
}

export default globalTeardown;
