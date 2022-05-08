import { Client, Intents } from 'discord.js'

import deploy from './deploy-commands'
import getCommands from './get-commands'

require('dotenv').config()
;(async () => {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
  const commands = await getCommands()

  await deploy(commands)

  client.once('ready', () => {
    console.log('Ready!')
  })

  client.on('interactionCreate', async (interaction: any) => {
    if (!interaction.isCommand()) return

    const command = commands.get(interaction.commandName)

    if (!command) return

    try {
      await command.execute(interaction)
    } catch (error) {
      console.error(error)
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      })
    }
  })

  client.login(process.env.DISCORD_TOKEN)
})()
