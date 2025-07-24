import React from 'react'
import { loadConfigAsync } from '@utils/config.js'
import { Command } from 'commander'
import { GitRepository } from '@services/GitRepository.js'
import { withFullScreen } from 'fullscreen-ink'
import { App } from '@views/app/App.js'
import { initializeLogger } from '@utils/logger.js'

const loadConfig = async (cmd: Command) => {
  const cwd = cmd.optsWithGlobals().cwd
  return await loadConfigAsync(cwd || null)
}

export const interactiveAppInit = async (
  cmd: Command,
  args: Record<string, unknown> = {},
) => {
  const allOptions = cmd.optsWithGlobals()
  const config = await loadConfig(cmd)

  initializeLogger(!!allOptions.debug || process.env.DEV === 'true')

  const ink = withFullScreen(
    React.createElement(App, {
      ...args,
      config,
      workingDir: allOptions.cwd || null,
    }),
    { exitOnCtrlC: false },
  )
  await ink.start()
  await ink.waitUntilExit()

  // DEVELOPMENT MODE CLEANUP:
  // When DEV=true, Ink automatically imports react-devtools-core and calls connectToDevTools()
  // This creates a WebSocket server connection for DevTools communication.
  // The WebSocket connection has active listeners that keep the Node.js event loop alive when
  // we unmount the process. There's a realistic chance that our unmount logic has something to
  // do with this issue, so we should look into it in the future. For now, we exit with
  // process.exit(0) to terminate the WebSocket and close the process.
  if (process.env.DEV) {
    process.exit(0)
  }
}

export const nonInteractiveAppInit = async (cmd: Command) => {
  const allOptions = cmd.optsWithGlobals()
  const config = await loadConfig(cmd)

  initializeLogger(!!allOptions.debug || process.env.DEV === 'true')

  const gitRepo = new GitRepository(config, allOptions.cwd || null)
  return {
    gitRepo,
    config,
    allOptions,
  }
}
