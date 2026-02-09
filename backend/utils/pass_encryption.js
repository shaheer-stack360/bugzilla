import bcrypt from 'bcryptjs';

export default async function encrypt_pass(password) {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
}