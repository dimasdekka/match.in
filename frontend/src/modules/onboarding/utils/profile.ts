export function ageFromBirthDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return -1;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const born = new Date(year, month - 1, day);
  if (born.getFullYear() !== year || born.getMonth() !== month - 1 || born.getDate() !== day)
    return -1;
  const now = new Date();
  if (born > now) return -1;
  let age = now.getFullYear() - born.getFullYear();
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age -= 1;
  return age;
}

export function profileStepError({
  name,
  birthDate,
  city,
}: {
  name: string;
  birthDate: string;
  city: string;
}) {
  if (name.trim().length < 2) return 'Enter a full name with at least 2 characters.';
  const age = ageFromBirthDate(birthDate);
  if (age < 18)
    return age < 0 ? 'Choose a valid date of birth.' : 'You must be at least 18 years old.';
  if (age > 100) return 'Choose a valid date of birth (maximum age is 100).';
  if (city.trim().length < 2) return 'Choose your city to continue.';
  return '';
}
