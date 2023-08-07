export type HalSteadMetrics = {
  length: number;
  vocabulary: number;
  volume: number;
  difficulty: number;
  effort: number;
  time: number;
  bugsDelivered: number;
  operands: {
    total: number;
    _unique: string[];
    unique: number;
  };
  operators: {
    total: number;
    _unique: number[];
    unique: number;
  };
};

export type ComplexityFileData = {
  path: string;
  maintainability: {
    maximum: {
      index: number;
      volume: number;
      cyclomatic: number;
    };
    average: {
      index: number;
      cyclomatic: number;
      volume: number;
    };
    sloc: number;
  },
  cyclomaticComplexity: {
    [key: string]: number;
  };
  halstead: {
    [key: string]: HalSteadMetrics
  };
  sloc: {
    [key: string]: number
  };
};

export type Complexity = {
  file: string;
  module: string;
  maintainability: {
    score: number;
    volume: number;
    cyclomatic: number;
    sloc: number;
  };
  _metrics: ComplexityFileData;
};
