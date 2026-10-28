import './envConfig.js' // keep at the top to make sure envs are available inside other imports
import { start } from './server.js'

await start(+(process.env.APP_PORT ?? 3000))
