import esbuildPluginTsc from 'esbuild-plugin-tsc';

export function createBuildSettings(options) {
  return {
    entryPoints: ['src/test.ts'],
    outfile: 'dist/bundle.js',
    bundle: true,
    plugins: [
      esbuildPluginTsc({
        force: true
      }),
    ],
    ...options
  };
}
