/*
  Omnity Hub content. Both pages are drawn from this file.

  Adding a game
    Copy an entry and give it a unique id. The id is the page address,
    script.html?id=<id>. Games show in the order they are listed here.

    status     "live" lists it under Live now, "soon" under Coming soon.
    featured   One live game gets the big tile.
    placeId    The number in the game's Roblox URL. Powers "Open on Roblox".
    universeId The game's universe. Powers the live player count and the
               Roblox thumbnail. Look it up at
               https://apis.roproxy.com/universes/v1/places/<placeId>/universe
    load       The one line players copy. Leave it "" and the game links to
               the Discord instead of showing a Copy button.
    image      Your own 16:9 picture, 1280x720 is ideal. Drop the file in
               assets/games/ and set image: "assets/games/<id>.jpg".
               Leave it "" to use the game's Roblox thumbnail, or a drawn
               cover when Roblox cannot be reached.
    icon       Optional square icon for the script page.
    genre      Picks the drawn cover's pattern: Shooter, PvP, Obby, Survival,
               Simulator, Anime, Battlegrounds, RNG or Horror.
    features   Groups of feature names. They become the menu tabs and the
               list on the script page. Leave it out until it is ready.
*/
window.OMNITY = {
  discord: "https://discord.gg/kD2tyZ8Pdz",
  logo: "https://oblivion.menu/omnity/logo.png",

  games: [
    { id: "steal-an-egg", game: "Steal An Egg", genre: "Simulator", status: "live", placeId: 107778070777162, universeId: 10563114921, load: "", image: "" },
    {
      id: "mm2",
      game: "Murder Mystery 2",
      genre: "Horror",
      status: "live",
      featured: true,
      placeId: 142823291,
      universeId: 66654135,
      title: "Auto Shoot, Knife Throw & ESP",
      blurb: "Auto shoot the murderer, throw with prediction, see every role and grab the gun the moment it drops.",
      load: 'loadstring(game:HttpGet("https://oblivion.menu/omnity/mm2"))()',
      image: "https://oblivion.menu/omnity/mm2.jpg",
      icon: "https://oblivion.menu/omnity/mm2-icon.jpg",
      tags: ["Auto Shoot", "Knife Throw", "Role ESP"],
      features: {
        Combat: ["Auto Shoot Murderer", "Knife Throw", "Ping Prediction", "Grab Gun", "Fling Murderer", "Fling Sheriff", "Flick", "Keybinds"],
        Movement: ["Gold Bomb Jump", "Normal Bomb Jump", "Speed Glitch", "Adjustable Glitch Speed", "Stretched Resolution", "Wall Hop", "Anti-Fling", "Velocity Cap"],
        ESP: ["Role ESP", "Role Filter", "Custom Role Colours", "Dropped Gun ESP", "Live Murderer & Sheriff Detector"],
        Visuals: ["Skybox Presets", "Custom Skybox ID", "Crosshair Presets", "Custom Crosshair ID", "Spinning Crosshair", "FPS Boost", "High Graphics", "FOV Slider"],
        Menu: ["6 Themes", "Custom Accent Colour", "Auto-Saved Settings", "Live Players, Ping & FPS", "Infinite Yield Loader"],
      },
    },
    { id: "rivals", game: "RIVALS", genre: "Shooter", status: "live", placeId: 17625359962, universeId: 6035872082, load: "", image: "" },
    { id: "ride-a-pet", game: "Ride A Pet", genre: "Simulator", status: "live", placeId: 124216119978534, universeId: 10035204815, load: "", image: "" },
    { id: "slayers-2", game: "Slayers 2", genre: "Anime", status: "live", placeId: 16205713724, universeId: 5595353122, load: "", image: "" },

    { id: "jujutsu-shenanigans", game: "Jujutsu Shenanigans", genre: "Battlegrounds", status: "soon", placeId: 9391468976, universeId: 3508322461, image: "" },
    { id: "speed-keyboard-escape", game: "+1 Speed Keyboard Escape", genre: "Obby", status: "soon", placeId: 95082159892680, universeId: 9584852943, image: "" },
    { id: "blade-ball", game: "Blade Ball", genre: "PvP", status: "soon", placeId: 13772394625, universeId: 4777817887, image: "" },
    { id: "loot-to-forge", game: "+1 Loot To Forge", genre: "Simulator", status: "soon", placeId: 118805555015549, universeId: 10684750879, image: "" },
    { id: "anime-dice", game: "Anime Dice", genre: "RNG", status: "soon", placeId: 113290951185459, universeId: 10708913337, image: "" },
    { id: "tower-of-hell", game: "Tower of Hell", genre: "Obby", status: "soon", placeId: 1962086868, universeId: 703124385, image: "" },
    { id: "murderers-vs-sheriffs", game: "Murderers VS Sheriffs", genre: "PvP", status: "soon", placeId: 135856908115931, universeId: 7219654364, image: "" },
    { id: "kick-a-lucky-block", game: "Kick a Lucky Block", genre: "Simulator", status: "soon", placeId: 89469502395769, universeId: 10004244222, image: "" },
    { id: "100-days-at-sea", game: "100 Days At Sea", genre: "Survival", status: "soon", placeId: 70411440483149, universeId: 9167377564, image: "" },
    { id: "one-tap", game: "One Tap", genre: "Shooter", status: "soon", placeId: 90568084448279, universeId: 9294074907, image: "" },
    { id: "wings-for-eggs", game: "+1 Wings For Eggs", genre: "Simulator", status: "soon", placeId: 80242821185181, universeId: 10764897725, image: "" },
    { id: "knife-duels", game: "KNIFE DUELS", genre: "PvP", status: "soon", placeId: 112731528776884, universeId: 9641502068, image: "" },
    { id: "pull-an-egg", game: "Pull An Egg", genre: "Simulator", status: "soon", placeId: 70640255604878, universeId: 10649255304, image: "" },
    { id: "murder-duels", game: "Murder Duels", genre: "PvP", status: "soon", placeId: 120851538706364, universeId: 9561553764, image: "" },
    { id: "troll-hug-tower", game: "TROLL Hug Tower", genre: "Obby", status: "soon", placeId: 103037106396302, universeId: 10460801145, image: "" },
    { id: "speed-monkey-escape", game: "+1 Speed Monkey Escape", genre: "Obby", status: "soon", placeId: 114697347887839, universeId: 10144280947, image: "" },
    { id: "natural-disaster-survival", game: "Natural Disaster Survival", genre: "Survival", status: "soon", placeId: 189707, universeId: 65241, image: "" },
  ],
};
