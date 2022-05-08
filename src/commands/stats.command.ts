import { SlashCommandBuilder } from '@discordjs/builders'
import {
  BaseCommandInteraction,
  MessageEmbed,
  TextChannel,
  ThreadChannel,
} from 'discord.js'
import { DateTime } from 'luxon'

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Статистика по всем каналам (по умолчанию за сегодня)')
    .addStringOption((option) => {
      return option
        .setName('date')
        .setRequired(false)
        .setDescription('дата в формате dd.mm.yyyy')
    }),

  async execute(interaction: BaseCommandInteraction) {
    await interaction.deferReply()

    const dateStr =
      (interaction.options.get('date', false)?.value as string) ||
      DateTime.now().toFormat('dd.MM.yyyy')
    const date = DateTime.fromFormat(dateStr, 'dd.MM.yyyy')
    if (!date.isValid) {
      await interaction.editReply('Ошибка: Неправильная дата')
      return
    }

    const stats: Record<string, Record<string, number>> = {}

    let totalMsgs = 0

    const processChannel = async (channel: TextChannel | ThreadChannel) => {
      let before: string
      let loop = true

      let channelMsgsCount = 0

      while (loop) {
        const msgs = await channel.messages.fetch({
          limit: 100,
          before: before,
        })
        if (!msgs.size) break

        before = msgs.lastKey()
        for (const [, msg] of msgs) {
          const msgDate = DateTime.fromJSDate(msg.createdAt)
          if (msgDate.startOf('day') < date) {
            loop = false
          }

          if (msgDate.toFormat('dd.MM.yyyy') !== dateStr) continue

          totalMsgs++
          channelMsgsCount++

          if (msg.author.username in stats) {
            if (channel.name in stats[msg.author.username])
              stats[msg.author.username][channel.name]++
            else stats[msg.author.username][channel.name] = 1
          } else {
            stats[msg.author.username] = { [channel.name]: 1 }
          }
        }
      }
      if (!channelMsgsCount) return ''

      let s = `Всего: ${channelMsgsCount} сообщений\n`
      s += '```'
      const names = Object.keys(stats)
      names.sort(
        (a, b) => (stats[b][channel.name] ?? 0) - (stats[a][channel.name] ?? 0),
      )
      for (const name of names) {
        if (!stats[name][channel.name]) continue
        s += `${name}`.padEnd(15, ' ') + `${stats[name][channel.name]}\n`
      }
      s += '```'

      return s
    }

    const embed = new MessageEmbed().setTitle('Статистика')
    const fields = []

    const channels = await interaction.guild.channels.fetch()
    for (const [, channel] of channels) {
      if (channel.type !== 'GUILD_TEXT') continue

      const { threads } = await channel.threads.fetch()
      for (const [, thread] of threads) {
        const text = await processChannel(thread)
        if (text) fields.push({ name: channel.name, value: text })
      }

      const text = await processChannel(channel)
      if (text) fields.push({ name: channel.name, value: text })
    }

    let s = `${totalMsgs} сообщений за ${dateStr} на этом сервере`
    s += '```'
    const names = Object.keys(stats)
    names.sort(
      (a, b) =>
        Object.values(stats[b]).reduce((acc, n) => acc + n, 0) -
        Object.values(stats[a]).reduce((acc, n) => acc + n, 0),
    )
    for (const user of names) {
      const sum = Object.values(stats[user]).reduce((acc, n) => acc + n, 0)
      s += `${user}`.padEnd(15, ' ') + `${sum}\n`
    }
    s += '```'

    embed.setDescription(s)
    embed.addFields(fields)

    await interaction.editReply({ embeds: [embed] })
  },
}
