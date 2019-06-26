import {Question} from '../types'

export const getTotalCorrectAnswers = (questions: Question[]) =>
  questions.filter(question => question.correct === true).length
