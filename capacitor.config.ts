import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'kz.qalafix.app',
  appName: 'QalaFix AI',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#f8fafc',
  },
}

export default config
