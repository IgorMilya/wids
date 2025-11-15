import { WifiNetworkType } from 'types'

export const tableTitle: string[] = ['SSID', 'Authentication', 'Encryption', 'BSSID', 'Signal', 'Risk']

export const getNetworkVerdict = (network: WifiNetworkType): { description: string; verdict: string } => {
  const { ssid, bssid, authentication, encryption, signal, risk, is_evil_twin } = network

  const lines: string[] = []

  // Basic technical info in plain language
  lines.push(ssid ? `Network name: "${ssid}"` : 'Hidden network name')
  lines.push(bssid ? `Network ID: ${bssid}` : 'Hidden network ID')

  // Authentication
  let authVerdict = ''
  if (authentication) {
    if (authentication.toLowerCase().includes('wpa3')) {
      lines.push('Authentication: WPA3 — strong security')
      authVerdict = 'strong authentication'
    } else if (authentication.toLowerCase().includes('wpa2')) {
      lines.push('Authentication: WPA2 — moderate security')
      authVerdict = 'moderate authentication'
    } else if (authentication.toLowerCase().includes('wpa')) {
      lines.push('Authentication: WPA — weak security')
      authVerdict = 'weak authentication'
    } else {
      lines.push(`Authentication: ${authentication} — unknown strength`)
      authVerdict = 'unknown authentication'
    }
  } else {
    lines.push('No authentication — anyone can connect')
    authVerdict = 'no authentication'
  }

  let encVerdict = ''
  if (encryption) {
    if (encryption.toLowerCase().includes('aes') || encryption.toLowerCase().includes('ccmp')) {
      lines.push('Strong encryption — keeps your data safe')
      encVerdict = 'strong encryption'
    } else if (encryption.toLowerCase().includes('tkip')) {
      lines.push('Encryption: TKIP — weak encryption')
      encVerdict = 'weak encryption'
    } else if (encryption.toLowerCase().includes('wep')) {
      lines.push('Very weak encryption — data is unsufficient secured')
      encVerdict = 'very weak encryption'
    } else {
      lines.push(`Encryption: ${encryption} — unknown strength`)
      encVerdict = 'unknown encryption'
    }
  } else {
    lines.push('No encryption — data is unprotected')
    encVerdict = 'no encryption'
  }


  // Signal
  let signalVerdict = ''
  if (signal !== undefined && signal !== null) {
    if (signal > '75') {
      lines.push('Signal: Strong — reliable connection')
      signalVerdict = 'good signal'
    } else if (signal > '50') {
      lines.push('Signal: Medium — connection may fluctuate')
      signalVerdict = 'moderate signal'
    } else {
      lines.push('Signal: Weak — connection may be unstable')
      signalVerdict = 'weak signal'
    }
  } else {
    lines.push('Signal strength unknown')
    signalVerdict = 'unknown signal'
  }

  // Risk
  let riskVerdict = ''
  switch (risk) {
    case 'C':
      lines.push('Risk: Critical — highly dangerous network')
      riskVerdict = 'high risk'
      break
    case 'H':
      lines.push('Risk: High — not recommended for non-technical users')
      riskVerdict = 'high risk'
      break
    case 'M':
      lines.push('Risk: Medium — caution advised')
      riskVerdict = 'medium risk'
      break
    case 'L':
      lines.push('Risk: Low — generally safe to use')
      riskVerdict = 'low risk'
      break
    case 'WL':
      lines.push('Whitelisted — safe to connect')
      riskVerdict = 'safe'
      break
    default:
      lines.push('Risk unknown — be careful')
      riskVerdict = 'unknown risk'
  }

  if (is_evil_twin && risk !== 'WL') {
    lines.push('⚠ Warning: Possible Evil Twin network!')
    riskVerdict = 'high risk (possible Evil Twin)'
  }

  // Generate human-readable verdict
  let verdict = ''
  if (risk === 'L' || risk === 'WL') {
    verdict = `This network is safe to connect. ${signalVerdict.charAt(0).toUpperCase() + signalVerdict.slice(1)}.`
  } else if (risk === 'C' || risk === 'H' || is_evil_twin) {
    verdict = `Due to ${authVerdict}, ${encVerdict}, and the ${riskVerdict}, this network is harmful or dangerous. Better avoid it or add to blacklist.`
  } else if (risk === 'M') {
    verdict = `Because of ${authVerdict}, ${encVerdict}, and ${signalVerdict}, this network is moderately safe, but connection may not be stable.`
  } else {
    verdict = `Risk is unknown. Be cautious if connecting to this network.`
  }

  return {
    description: lines.join('\n'),
    verdict,
  }
}
