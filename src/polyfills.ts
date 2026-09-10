import { Buffer } from 'buffer'
import process from 'process'

;(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer
;(window as unknown as { process: typeof process }).process = process
