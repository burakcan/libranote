export async function wrapDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    if (error instanceof Error && error.name === "DatabaseClosedError") {
      throw new Error(
        "Database is not initialized or has been closed. Please try again."
      );
    }
    throw error;
  }
}
