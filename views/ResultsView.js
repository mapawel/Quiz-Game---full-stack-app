import React from 'react'
import HeadTemplate from './templates/HeadTemplate';
import Navbar from './templates/Navbar';
import ResultsTables from './components/organizms/ResultsTables';

const Results = ({ userName, title, results, page, isLoadingDisabled }) => (
  <HeadTemplate
    title={title}
  >
    <Navbar userName={userName} />
      <ResultsTables results={results} page={page} isLoadingDisabled={isLoadingDisabled} />
  </HeadTemplate>
)

export default Results;