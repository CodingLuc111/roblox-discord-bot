const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const express = require("express");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const app = express();
app.use(express.json());

let commandQueue = [];

app.get("/commands", (req, res) => {
  res.json(commandQueue);
  commandQueue = [];
});

app.listen(3000, () => console.log("Bot Server läuft ✨"));

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const pets = ["Dog", "Cat", "Dragon", "MegaClicker"];

client.once("ready", async () => {
  console.log(`Bot ist online: ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("spawn")
      .setDescription("Spawn ein Pet")
      .addStringOption(option =>
        option
          .setName("pet")
          .setDescription("Wähle ein Pet")
          .setRequired(true)
          .setAutocomplete(true)
      ),

    new SlashCommandBuilder()
      .setName("give")
      .setDescription("Gib Geld")
      .addUserOption(option =>
        option
          .setName("player")
          .setDescription("Spieler auswählen")
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option
          .setName("amount")
          .setDescription("Wie viel?")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("event")
      .setDescription("Starte Event")
      .addStringOption(option =>
        option
          .setName("name")
          .setDescription("Event Name")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("announce")
      .setDescription("Announcement")
      .addStringOption(option =>
        option
          .setName("message")
          .setDescription("Die Nachricht")
          .setRequired(true)
      )
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
});

client.on("interactionCreate", async (interaction) => {

  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused();
    const filtered = pets.filter(p =>
      p.toLowerCase().includes(focused.toLowerCase())
    );
    await interaction.respond(filtered.map(p => ({ name: p, value: p })));
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  // Keine Admin‑Rechte?
  if (!interaction.member.permissions.has("Administrator")) {
    await interaction.reply({
      content: "Du hast keine Rechte, diesen Befehl zu nutzen!",
      ephemeral: true
    });
    return;
  }

  if (interaction.commandName === "spawn") {
    const pet = interaction.options.getString("pet");
    commandQueue.push({ type: "spawn", pet });
    await interaction.reply(`Spawn: ${pet}`);
  }

  if (interaction.commandName === "give") {
    const player = interaction.options.getUser("player");
    const amount = interaction.options.getInteger("amount");
    commandQueue.push({ type: "give", playerId: player.id, amount });
    await interaction.reply(`Geld ${amount} gegeben an ${player.username}`);
  }

  if (interaction.commandName === "event") {
    const name = interaction.options.getString("name");
    commandQueue.push({ type: "event", name });
    await interaction.reply(`Event gestartet: ${name}`);
  }

  if (interaction.commandName === "announce") {
    const message = interaction.options.getString("message");
    commandQueue.push({ type: "announce", message });
    await interaction.reply(`Announcement: ${message}`);
  }
});

client.login(TOKEN);
