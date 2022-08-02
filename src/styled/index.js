import styled from "styled-components";

export const Column = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: ${({ p = 0 }) => p};
  margin: ${({ m = 0 }) => m};
`;

export const Row = styled.div`
  box-sizing: border-box;
  display: flex;
`;
