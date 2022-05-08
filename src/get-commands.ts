import { SlashCommandBuilder } from '@discordjs/builders'
import { Collection } from 'discord.js'

const fs = require('fs')

export default async (): Promise<Commands> => {
  const commands = new Collection<string, Command>()
  const commandFiles = fs
    .readdirSync('./src/commands')
    .filter((file) => file.endsWith('.ts'))

  for (const file of commandFiles) {
    const { default: command } = await import(
      `./commands/${file.replace('.ts', '.js')}`
    )
    commands.set(command.data.name, command)
  }

  return commands
}

export interface Command {
  data: SlashCommandBuilder
  execute: (interaction: any) => Promise<any>
}
export type Commands = Collection<string, Command>
