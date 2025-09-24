const encodeUtf8 = (value: string): Uint8Array => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value)
  }

  const utf8: number[] = []
  for (let i = 0; i < value.length; i++) {
    let charCode = value.charCodeAt(i)
    if (charCode < 0x80) {
      utf8.push(charCode)
    } else if (charCode < 0x800) {
      utf8.push(0xc0 | (charCode >> 6))
      utf8.push(0x80 | (charCode & 0x3f))
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      utf8.push(0xe0 | (charCode >> 12))
      utf8.push(0x80 | ((charCode >> 6) & 0x3f))
      utf8.push(0x80 | (charCode & 0x3f))
    } else {
      i++
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (value.charCodeAt(i) & 0x3ff))
      utf8.push(0xf0 | (charCode >> 18))
      utf8.push(0x80 | ((charCode >> 12) & 0x3f))
      utf8.push(0x80 | ((charCode >> 6) & 0x3f))
      utf8.push(0x80 | (charCode & 0x3f))
    }
  }
  return Uint8Array.from(utf8)
}

const decodeUtf8 = (bytes: Uint8Array): string => {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes)
  }

  let result = ''
  for (let i = 0; i < bytes.length; ) {
    const byte1 = bytes[i++]
    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1)
      continue
    }

    if (byte1 >= 0xc0 && byte1 < 0xe0) {
      const byte2 = bytes[i++]
      result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f))
      continue
    }

    if (byte1 >= 0xe0 && byte1 < 0xf0) {
      const byte2 = bytes[i++]
      const byte3 = bytes[i++]
      result += String.fromCharCode(
        ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f)
      )
      continue
    }

    const byte2 = bytes[i++]
    const byte3 = bytes[i++]
    const byte4 = bytes[i++]
    const codePoint =
      ((byte1 & 0x07) << 18) |
      ((byte2 & 0x3f) << 12) |
      ((byte3 & 0x3f) << 6) |
      (byte4 & 0x3f)
    const adjusted = codePoint - 0x10000
    result += String.fromCharCode(0xd800 + (adjusted >> 10))
    result += String.fromCharCode(0xdc00 + (adjusted & 0x3ff))
  }
  return result
}

const base64UrlEncode = (value: string): string => {
  const bytes = encodeUtf8(value)

  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    let binary = ''
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })
    return window
      .btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  }

  const buffer = (globalThis as any).Buffer as
    | { from: (value: Uint8Array) => { toString: (encoding: string) => string } }
    | undefined
  if (buffer) {
    return buffer
      .from(bytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  }

  throw new Error('Base64 encoding no soportado en este entorno')
}

const base64UrlDecode = (value: string): string => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64

  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    const binary = window.atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return decodeUtf8(bytes)
  }

  const buffer = (globalThis as any).Buffer as
    | { from: (value: string, encoding: string) => { toString: (encoding: string) => string } }
    | undefined
  if (buffer) {
    return buffer.from(padded, 'base64').toString('utf8')
  }

  throw new Error('Base64 decoding no soportado en este entorno')
}

const createSignature = (input: string, secret: string): string => {
  return base64UrlEncode(`${input}.${secret}`)
}

export const createMockJwt = (
  payload: Record<string, unknown>,
  secret = 'nexopos-demo-secret'
): string => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = createSignature(`${encodedHeader}.${encodedPayload}`, secret)

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export const decodeMockJwt = <T extends Record<string, unknown> = Record<string, unknown>>(
  token: string
): T | null => {
  const parts = token.split('.')
  if (parts.length < 2) return null
  const [, payload] = parts

  try {
    const json = base64UrlDecode(payload)
    return JSON.parse(json) as T
  } catch (error) {
    console.warn('No se pudo decodificar el token mock', error)
  }

  return null
}
