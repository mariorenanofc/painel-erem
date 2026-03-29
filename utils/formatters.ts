export const formatarDataTabela = (dataString: string) => {
  if (!dataString) return "";
  try {
    const dataObj = new Date(dataString);
    if (isNaN(dataObj.getTime())) return dataString;
    return dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dataString;
  }
};

export const formatarDataInput = (dataString: string) => {
  if (!dataString) return "";
  try {
    const dataObj = new Date(dataString);
    if (isNaN(dataObj.getTime())) return dataString;
    return dataObj.toISOString().split('T')[0];
  } catch {
    return dataString;
  }
};