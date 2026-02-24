/**
 * Webpack configuration for NestJS
 * Excludes native dependencies from bundling
 */

module.exports = function (options, webpack) {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
    '@mapbox/node-pre-gyp',
    'bcrypt',
  ];

  return {
    ...options,
    externals: [],
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            return false;
          }
          // Ignore optional dependencies from node-pre-gyp
          if (resource.includes('mock-aws-s3') || 
              resource.includes('aws-sdk') || 
              resource.includes('nock') ||
              resource.includes('.html')) {
            return true;
          }
          return false;
        },
      }),
    ],
  };
};
