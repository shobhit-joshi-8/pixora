import { ImageKit, toFile } from '@imagekit/nodejs';

export const imagekit = new ImageKit({
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY || ""
});

export { toFile }

