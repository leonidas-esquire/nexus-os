export const getLoginUrl = (returnPath?: string) => {
  const destination = returnPath ?? `${window.location.pathname}${window.location.search}`;
  return `/sign-in?redirect_url=${encodeURIComponent(destination)}`;
};
