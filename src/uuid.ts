const UUID_LENGTH = 6;

export const uuid = () => {
  const CHARS_SOURCE = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

  let uid = '';

  for (let i = 0; i < UUID_LENGTH; i += 1) {
    uid += CHARS_SOURCE[Math.floor(Math.random() * CHARS_SOURCE.length)];
  }

  return uid;
};

export const validateUid = (uid: string) =>
  new RegExp(`^[\\w-]{${UUID_LENGTH},${UUID_LENGTH}}$`).test(uid);
