export const databaseErrorCode = (error) =>
  error.original?.code || error.parent?.code || error.code;
