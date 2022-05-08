import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import fs from 'fs-extra'

import { Commands } from './get-commands'

const deploy = async (commands: Commands) => {
  const json = [...commands.values()].map((cmd) => cmd.data.toJSON())

  if (fs.existsSync('./lastDeploy.json')) {
    const last = await fs.readFile('./lastDeploy.json', 'utf8')
    if (last === JSON.stringify(json)) return commands
  }

  console.log('Deploying commands')

  const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN)

  const simpleJson = json.map((cmd) => {
    const optionless = { ...cmd }
    delete optionless.options
    return optionless
  })

  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: simpleJson,
  })

  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: json,
  })

  fs.writeFile('./lastDeploy.json', JSON.stringify(json))
}

export default deploy
