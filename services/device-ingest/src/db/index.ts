import drizzle from '@home-on/drizzle'
import { relations } from './relations/index.js'

//fixme
export default drizzle('device-ingest', relations as any)
