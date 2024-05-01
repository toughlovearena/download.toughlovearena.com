# install

Most of the heavy work is already done via GitHub actions and node scripts. It just needs a little help setting up.

## debugging mac notarization 2024/04/30

the error: https://github.com/toughlovearena/download.toughlovearena.com/actions/runs/8411525704/job/23031218877#step:8:74

```log
2024-03-24 19:13:25.833 *** Warning: Notarization of MacOS applications using altool has been decommissioned. Please use notarytool. See: https://developer.apple.com/documentation/technotes/tn3147-migrating-to-the-latest-notarization-tool (-1030)
```
current electron action appears to be extremely out of date and unmaintained: https://github.com/samuelmeuli/action-electron-builder/issues/101

### paths forward
1. try to follow conversation and fix from other lib users: https://github.com/buttercup/buttercup-desktop/issues/1307
2. use electron builder directly in build script: https://github.com/electron-userland/electron-builder
3. use this newer, simpler github action: https://github.com/x6pnda/action-electron-compiler

once done, revert these commits

- https://github.com/toughlovearena/download.toughlovearena.com/commit/cf7e380e3e9a5e369decaf361222a7f61c9f7ec2
- https://github.com/toughlovearena/download.toughlovearena.com/commit/505d4f41d49531c876d0457e909ac51bd5458636
- https://github.com/toughlovearena/download.toughlovearena.com/commit/82c7dcdbea37c08dcac7f18e92e1ecd8a737b79f

## setting up

Important things to know about this repository and workflow.

### testing locally

```bash
# download app locally
yarn fetch
# or
yarn fetch-debug

# run electron of local files
yarn start
```

### triggering run

[release.yml](.github/workflows/release.yml) is currently triggered when a new version tag is pushed to remote. These are the steps:

- Load in platform secrets stored in GitHub repo settings (see below)
- Fetches the TLA zip file matching the version in this repo's [package.json](package.json)
  - This assumes the version in package.json matches the inciting tag
  - This is currently ensured by a script in the closed-source main TLA repo
- Build the electron app (currently for 3 platforms)
  - Each app is appending to a draft release matching the inciting tag
- Publish the above draft release

### mac signing

- Open the Keychain Access app or the Apple Developer Portal. Export all certificates related to your app into a _single_ file (e.g. `certs.p12`) and set a strong password
- Base64-encode your certificates using the following command: `base64 -i certs.p12 -o encoded.txt`
- In your project's GitHub repository, go to Settings → Secrets and add the following variables:
  - `mac_certs`: Your encoded certificates, i.e. the content of the `encoded.txt` file you created before
  - `mac_certs_password`: The password you set when exporting the certificates

### mac notarizing

- Sign in to Apple's App Store Connect and open the [API key page](https://appstoreconnect.apple.com/access/api)
- Create a new API key with access permission “App Manager”
- In your project's GitHub repository, go to Settings → Secrets and add the following variables:
  - `api_key`: Content of the API key file (with the `p8` file extension)
  - `api_key_id`: Key ID found on App Store Connect
  - `api_key_issuer_id`: Issuer ID found on App Store Connect

### steam app

Built on top of [game-ci/steam-deploy](https://github.com/game-ci/steam-deploy)

- Create a specialized Steam [builder account](https://partner.steamgames.com/doc/sdk/uploading#Build_Account) with the following permissions:
  - `Edit App Metadata`
  - `Publish App Changes To Steam`
- Setup 2FA for your builder account (do this on your local dev machine)
  - Download the [Steamworks SDK](https://partner.steamgames.com/downloads/steamworks_sdk.zip)
    - NOTE: Download link only works if you are already logged into partner.steamgames.com
  - Windows Directions
    - Unzip and cd into `tools\ContentBuilder\builder`
    - `steamcmd +login "username" "password" +quit` to login locally
      - Complete the MFA login by entering the emailed OPT
      - Verify success by running the command again - it should not ask for MFA
    - Open `config/config.vdf` and Base64 encode it to create the secret `STEAM_CONFIG_VDF`
    - `builder` contains two files whose names look like `ssfn<numbers>`, but one of them is a hidden file
      - Find the hidden one
      - The name of that file is the secret `STEAM_SSFN_FILE_NAME`
      - The content of that file, after being Base64 encoded, is the secret `STEAM_SSFN_FILE_CONTENTS`
  - Mac Directions
    - Unzip and cd into `tools/ContentBuilder/builder_osx`
    - `chmod +x steamcmd` to enable the main tool
    - `bash ./steam.sh` to trigger the auto-updater and load the CLI
      - `quit` to exit the CLI
    - `./steamcmd +login "username" "password" +quit` to login locally
      - Complete the MFA login by entering the emailed OPT
      - Verify success by running the command again - it should not ask for MFA
    - There should a recently edited `.vdf` file. Base64 encode it to create the secret `STEAM_CONFIG_VDF`
      - e.g. `cat update_hosts_cached.vdf | base64`
    - todo where to find ssfnFileName ???
- In your project's GitHub repository, go to Settings → Secrets and add the following variables:
  - `STEAM_APP_ID`: AppId found on the [dashboard](https://partner.steamgames.com/dashboard)
  - `STEAM_USERNAME`: Username for builder account
  - `STEAM_PASSWORD`: Password for builder account
  - `STEAM_CONFIG_VDF`: todo
  - `STEAM_SSFN_FILE_NAME`:
  - `STEAM_SSFN_FILE_CONTENTS`:

## debug

Lessons learned the hard way

### github actions

> 1+ builds fail

For `release.yml`, you need to delete the draft release before retrying

> `socket hang up`

You didn't delete the assets from the draft release before retrying

### mac errors

> You must first sign the relevant contracts online.

Check https://developer.apple.com/account/ to see if you need to sign any new agreements

### window icon not appearing the in taskbar

`icon.png` was working fine for Mac and desktop display, but the image appeared heavily truncated in the application menubar (top left) and the Windows taskbar (aka Application Dashboard)

Fix:

- 256px x 256px PNG file
- Make sure electron-builder uses it for windows
  - e.g. build.win.icon: "build/icon-256x256.png"
- Save it with "8-bit" Bit Depth
  - e.g. using paint.net on Windows

Sources:

- https://github.com/electron-userland/electron-builder/issues/810
- https://github.com/electron-userland/electron-builder/issues/2128#issuecomment-411797743
- https://github.com/electron-userland/electron-builder/issues/5083
- https://github.com/mb21/panwriter/issues/2

## credits

Big thanks to the following resources/guides:

- https://github.com/samuelmeuli/action-electron-builder
- https://samuelmeuli.com/blog/2019-12-28-notarizing-your-electron-app/
