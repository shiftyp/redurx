export const createLinkHandler = (history) => {
  return (e) => {
    return e.preventDefault() || history.push(e.target.getAttribute('href'))
  };
};
