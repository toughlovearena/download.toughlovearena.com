# install

Most of the heavy work is already done via GitHub actions and node scripts. It just needs a little help setting up.

## setting up GitHub Secrets

Once you provide these secrets, [release.yml](.github/workflows/release.yml) will do the rest

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

## credits

Big thanks to the following resources/guides:

- https://github.com/samuelmeuli/action-electron-builder
- https://samuelmeuli.com/blog/2019-12-28-notarizing-your-electron-app/
