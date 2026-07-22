export const formatCallDuration = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const pad = (n) => (n < 10 ? `0${n}` : n);
  return `${pad(mins)}:${pad(secs)}`;
};
