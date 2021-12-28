import { setupServer } from 'msw/node'
import { adminServiceHandlers } from './adminServiceHandlers'

// This configures a request mocking server with the given request handlers.
export const adminServiceServer = setupServer(...adminServiceHandlers)
