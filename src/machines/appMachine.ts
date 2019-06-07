import {assign, Machine} from 'xstate'
import {fetchAndNormalizeQuizData} from '../utils'

export const appMachine = Machine<
  AppMachineContext,
  AppMachineSchema,
  AppMachineEvent
>(
  {
    id: 'Machine',
    initial: 'welcome',
    context: {
      currentQuestion: 0,
      currentQuestionDisplay: 1,
      displayConfetti: false,
      questions: [],
      totalCorrectAnswers: 0,
    },
    states: {
      welcome: {
        on: {
          START_QUIZ: 'loading',
        },
      },
      loading: {
        invoke: {
          id: 'getQuizData',
          src: () => fetchAndNormalizeQuizData(),
          onDone: {
            target: 'quiz',
            actions: assign({questions: (context, event) => event.data}),
          },
          onError: {
            target: 'failure',
          },
        },
      },
      failure: {
        on: {
          RETRY: 'loading',
          START_OVER: 'welcome',
        },
      },
      quiz: {
        on: {
          '': {
            target: 'results',
            actions: 'updateDisplayConfetti',
            cond: 'allQuestionsAnswered',
          },
          ANSWER: {
            actions: 'updateAnswer',
          },
        },
      },
      results: {
        on: {
          PLAY_AGAIN: 'welcome',
        },
        exit: 'resetGame',
      },
    },
  },
  {
    actions: {
      resetGame: assign(ctx => ({
        currentQuestion: 0,
        currentQuestionDisplay: 1,
        displayConfetti: false,
        totalCorrectAnswers: 0,
      })),
      updateAnswer: assign((ctx, event) => ({
        questions: [
          ...ctx.questions.slice(0, ctx.currentQuestion),
          {
            ...ctx.questions[ctx.currentQuestion],
            userAnswer: event.answer,
            correct:
              ctx.questions[ctx.currentQuestion].correctAnswer === event.answer,
          },
          ...ctx.questions.slice(ctx.currentQuestion + 1),
        ],
        totalCorrectAnswers:
          ctx.questions[ctx.currentQuestion].correctAnswer === event.answer
            ? (ctx.totalCorrectAnswers += 1)
            : ctx.totalCorrectAnswers,
        currentQuestion: ctx.currentQuestion += 1,
        currentQuestionDisplay: ctx.currentQuestionDisplay += 1,
      })),
      updateDisplayConfetti: assign(ctx => ({
        displayConfetti: ctx.totalCorrectAnswers >= ctx.questions.length / 2,
      })),
    },
    guards: {
      allQuestionsAnswered: context => {
        return (
          context.questions.filter(question => question.correct !== undefined)
            .length === context.questions.length && true
        )
      },
    },
  },
)
