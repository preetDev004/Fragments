const getModule = () =>
  process.env.AWS_REGION
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./aws')
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./memory');

export const {
  deleteFragment,
  deleteFragments,
  listFragments,
  readFragment,
  readFragmentData,
  writeFragment,
  writeFragmentData,
} = getModule();
