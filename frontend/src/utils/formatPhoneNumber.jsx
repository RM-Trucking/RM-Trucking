const formatPhoneNumber = (value) => {
  if (!value) return value;
  
  // 1. Strip all non-numeric characters
  const phoneNumber = value.replace(/[^\d]/g, ''); 
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 4) return phoneNumber;
  
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }

  // 2. Standard 10-digit format rules
  if (phoneNumberLength <= 10) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
  }

  // 3. For 11+ digits, format the base 10-digits cleanly and append an extension block
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}${phoneNumber.slice(10)}`;
};

export default formatPhoneNumber;
