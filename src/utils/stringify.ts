// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stringify = (valueToStringify: any): string => {
  let stringified = '';

  try {
    stringified = JSON.stringify(valueToStringify)
  } catch (error) {
    stringified = 'Something went wrong on logging error';
  }

  return stringified;
}