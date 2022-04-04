export const uuid = () => {
  const CHARS_SOURCE = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
  const LENGTH = 11;

  let uid = '';

  for (let i = 0; i < LENGTH; i += 1) {
    uid += CHARS_SOURCE[Math.floor(Math.random() * CHARS_SOURCE.length)];
  }

  return uid;
};

export const validateUid = (uid: string) => /^[\w-]{11,11}$/.test(uid);
