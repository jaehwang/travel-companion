/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/TravelCompanion.app',
      build: [
        'xcodebuild',
        '-workspace ios/TravelCompanion.xcworkspace',
        '-scheme TravelCompanion',
        '-configuration Debug',
        '-sdk iphonesimulator',
        '-destination "platform=iOS Simulator,name=iPhone 17 Pro"',
        '-derivedDataPath ios/build',
        'build',
      ].join(' '),
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/TravelCompanion.app',
      build: [
        'xcodebuild',
        '-workspace ios/TravelCompanion.xcworkspace',
        '-scheme TravelCompanion',
        '-configuration Release',
        '-sdk iphonesimulator',
        '-destination "platform=iOS Simulator,name=iPhone 17 Pro"',
        '-derivedDataPath ios/build',
        'build',
      ].join(' '),
    },
    'ios.development': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/TravelCompanion.app',
      // NODE_ENV=development → .env.development 로드, -configuration Release → Metro 불필요
      build: [
        'NODE_ENV=development',
        'xcodebuild',
        '-workspace ios/TravelCompanion.xcworkspace',
        '-scheme TravelCompanion',
        '-configuration Release',
        '-sdk iphonesimulator',
        '-destination "platform=iOS Simulator,name=iPhone 17 Pro"',
        '-derivedDataPath ios/build',
        'build',
      ].join(' '),
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 17 Pro',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'ios.sim.development': {
      device: 'simulator',
      app: 'ios.development',
    },
  },
};
