//META{"name":"NativeTitlebarPatcher","website":"https://github.com/intrnl/discordextensions/issues/new","source":"https://github.com/intrnl/discordextensions/tree/master/NativeTitlebarPatcher"}*//

class NativeTitlebarPatcher {
  getName () { return 'NativeTitlebarPatcher' }
  getShortName () { return 'NativeTitlebarPatcher' }
  getDescription () { return "Enables native window frames (decorations) in Discord. Based on Zerebos' TransparencyPatcher plugin." }
  getVersion () { return '1.1.0' }
  getAuthor () { return 'intrnl' }
  get pluginURL () { return `https://raw.githubusercontent.com/intrnl/discordextensions/master/${this.getName()}/${this.getName()}.plugin.js` }

  constructor () {
    this.removalCSS = `/* NativeTitlebarPatcher */
    .hidden-by-NativeTitlebar .titleBar-AC4pGV {
      display: none;
    }
    `

    this.currentPlatform = ''
    this.appClassList = document.querySelector('.app-19_DXt').classList
    this.documentBody = document.body
  }

  load () {}
  unload () {}

  start () {
    var libraryScript = document.getElementById('zeresLibraryScript')
    if (!window.ZeresLibrary || window.ZeresLibrary.isOutdated) {
      if (libraryScript) libraryScript.parentElement.removeChild(libraryScript)
      libraryScript = document.createElement('script')
      libraryScript.setAttribute('type', 'text/javascript')
      libraryScript.setAttribute('src', 'https://rauenzi.github.io/BetterDiscordAddons/Plugins/PluginLibrary.js')
      libraryScript.setAttribute('id', 'zeresLibraryScript')
      document.head.appendChild(libraryScript)
    }

    if (window.ZeresLibrary) this.initialize()
    else libraryScript.addEventListener('load', () => { this.initialize() })
  }

  initialize () {
    BdApi.injectCSS(this.getShortName(), this.removalCSS)

    this.documentBody.addEventListener('click', this.hideMenuBarOnFocus, false)
    this.documentBody.classList.add('hidden-by-NativeTitlebar')

    if (this.appClassList.contains('platform-win')) { this.currentPlatform = 'win' };
    if (this.appClassList.contains('platform-osx')) { this.currentPlatform = 'osx' };
    if (this.appClassList.contains('platform-linux')) { this.currentPlatform = 'linux' };
    if (this.appClassList.contains('platform-web')) { this.currentPlatform = 'web' };

    this.appClassList.remove('platform-win', 'platform-osx', 'platform-linux', 'platform-web')
    this.appClassList.add('platform-web')
    this.appClassList.add(`platform-ori-${this.currentPlatform}`)

    this.initialized = true
    PluginUtilities.checkForUpdate(this.getName(), this.getVersion(), this.pluginURL)

    if (!InternalUtilities.webContents.browserWindowOptions.frame) {
      try {
        this.patchMainScreen()
        PluginUtilities.showToast('Successfully patched! Restarting...', {type: 'success'})
        this.relaunch()
      } catch (e) {
        PluginUtilities.showToast('Something went wrong trying to patch.', {type: 'error'})
      }
    }
  }

  stop () {
    BdApi.clearCSS(this.getShortName())

    this.documentBody.removeEventListener('click', this.hideMenuBarOnFocus, false)
    this.documentBody.classList.remove('hidden-by-NativeTitlebar')

    this.appClassList.remove('platform-web')
    this.appClassList.add(`platform-${this.currentPlatform}`)

    let fs = require('fs')
    var stats = fs.statSync(require('path').join(PluginUtilities.getPluginsFolder(), `${this.getName()}.plugin.js`))
    var pluginMTime = Math.floor((new Date().getTime() - new Date(stats.mtime).getTime()) / 1000)

    if (pluginMTime > 3) {
      try {
        this.unpatchMainScreen()
        PluginUtilities.showToast('Successfully unpatched! Restarting...', {type: 'success'})
        this.relaunch()
      } catch (e) {
        PluginUtilities.showToast('Something went wrong trying to unpatch.', {type: 'error'})
      }
    } else {
      PluginUtilities.showToast('NativeTitlebarPatcher was recently modified, skipping unpatch...')
    }
  }

  hideMenuBarOnFocus () {
    if (require('electron').remote.getCurrentWindow().isMenuBarVisible()) {
      require('electron').remote.getCurrentWindow().setMenuBarVisibility(false)
    }
  }

  relaunch () {
    setTimeout(() => {
      let app = require('electron').remote.app
      app.relaunch()
      app.exit()
    }, 3000)
  }

  getCorePath () {
    let app = require('electron').remote.app
    let releaseChannel = require(app.getAppPath() + '/build_info').releaseChannel
    let discordPath = releaseChannel === 'canary' ? 'discordcanary' : releaseChannel === 'ptb' ? 'discordptb' : 'discord'
    return `${app.getPath('appData')}/${discordPath}/${app.getVersion()}/modules/discord_desktop_core`
  }

  patchMainScreen () {
    let fs = require('fs')
    let mainScreenPath = `${this.getCorePath()}/core/app/mainScreen.js`
    let mainScreen = fs.readFileSync(mainScreenPath).toString().split('\n')

    for (let l = 0, len = mainScreen.length; l < len; l++) {
      let line = mainScreen[l]
      if (line.includes('frame: false,')) mainScreen[l] = line.replace('false', 'true')
    }

    fs.writeFileSync(mainScreenPath, mainScreen.join('\n'))
  }

  unpatchMainScreen () {
    let fs = require('fs')
    let mainScreenPath = `${this.getCorePath()}/core/app/mainScreen.js`
    let mainScreen = fs.readFileSync(mainScreenPath).toString().split('\n')

    for (let l = 0, len = mainScreen.length; l < len; l++) {
      let line = mainScreen[l]
      if (line.includes('frame: true,')) mainScreen[l] = line.replace('true', 'false')
    }

    fs.writeFileSync(mainScreenPath, mainScreen.join('\n'))
  }
}
