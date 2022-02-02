// https://github.com/sideway/joi/blob/013af552f30f736c12467bfd95fb3d3277b8eab1/lib/types/string.js#L695
const messages = {
  'string.alphanum': '"{0}" must only contain alpha-numeric characters',
  'string.base': '"{0}" must be a string',
  'string.base64': '"{0}" must be a valid base64 string',
  'string.creditCard': '"{0}" must be a credit card',
  'string.dataUri': '"{0}" must be a valid dataUri string',
  'string.domain': '"{0}" must contain a valid domain name',
  'string.email': '"{0}" must be a valid email',
  'string.empty': '"{0}" is not allowed to be empty',
  'string.guid': '"{0}" must be an UUID v4',
  'string.hex': '"{0}" must only contain hexadecimal characters',
  'string.hexAlign': '"{0}" hex decoded representation must be byte aligned',
  'string.hostname': '"{0}" must be a valid hostname',
  'string.ip': '"{0}" must be a valid ip address with a {{#cidr}} CIDR',
  'string.ipVersion':
    '"{0}" must be a valid ip address of one of the following versions {{#version}} with a {{#cidr}} CIDR',
  'string.isoDate': '"{0}" must be in iso format',
  'string.isoDuration': '"{0}" must be a valid ISO 8601 duration',
  'string.length': '"{0}" length must be {{#limit}} characters long',
  'string.lowercase': '"{0}" must only contain lowercase characters',
  'string.max': '"{0}" is greater than {{#limit}} chars',
  'string.min': '"{0}" is less than {{#limit}} chars',
  'string.normalize': '"{0}" must be unicode normalized in the {{#form}} form',
  'string.token':
    '"{0}" must only contain alpha-numeric and underscore characters',
  'string.pattern.base':
    '"{0}" with value {:[.]} fails to match the required pattern: {{#regex}}',
  'string.pattern.name':
    '"{0}" with value {:[.]} fails to match the {{#name}} pattern',
  'string.pattern.invert.base':
    '"{0}" with value {:[.]} matches the inverted pattern: {{#regex}}',
  'string.pattern.invert.name':
    '"{0}" with value {:[.]} matches the inverted {{#name}} pattern',
  'string.trim': '"{0}" must not have leading or trailing whitespace',
  'string.uri': '"{0}" must be a valid uri',
  'string.uriCustomScheme':
    '"{0}" must be a valid uri with a scheme matching the {{#scheme}} pattern',
  'string.uriRelativeOnly': '"{0}" must be a valid relative uri',
  'string.uppercase': '"{0}" must only contain uppercase characters',
  'string.regex': 'The "{0}" format is wrong',
};

export default messages;
