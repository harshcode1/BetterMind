// Stand-in for `next/headers`. Some routes call verifyAuth() with no argument, which reads the
// cookie through next/headers' cookies() — only available inside a real request. Tests use:
//   jest.mock('next/headers', () => require('../helpers/headersMock'));
// and then setCookieJar({ token }) to decide who is "logged in" for that call.
let jar = {};

export function setCookieJar(cookies) {
  jar = { ...cookies };
}

export function cookies() {
  return {
    get: (name) => (jar[name] !== undefined ? { name, value: jar[name] } : undefined),
  };
}
