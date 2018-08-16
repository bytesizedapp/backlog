import * as encode from 'serialize-javascript'

const decode = (serializedJavascript) => {
  return eval('(' + serializedJavascript + ')')
}

export { encode, decode }
