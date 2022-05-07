import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'

import getCommands from './get-commands'

require('dotenv').config()
;(async () => {
  const commands = await getCommands()

  const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN)

  rest
    .put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      {
        body: [...commands.values()].map((cmd) => cmd.data.toJSON()),
      },
    )
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error)
})()
