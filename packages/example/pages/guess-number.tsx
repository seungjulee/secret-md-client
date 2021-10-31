import {
    CertificateData,
    create as createPhala,
    PhalaInstance,
    randomHex,
    signCertificate
} from '@phala/sdk'
import type { ApiPromise } from '@polkadot/api'
import { hexAddPrefix, numberToHex, u8aToHex } from '@polkadot/util'
import { decodeAddress } from '@polkadot/util-crypto'
import accountAtom from 'atoms/account'
import { Block } from 'baseui/block'
import { Button } from 'baseui/button'
import { ButtonGroup } from 'baseui/button-group'
import { FormControl } from 'baseui/form-control'
import { Input } from 'baseui/input'
import { ProgressSteps, Step } from 'baseui/progress-steps'
import { StyledSpinnerNext } from 'baseui/spinner'
import { toaster } from 'baseui/toast'
import { LabelXSmall, ParagraphMedium } from 'baseui/typography'
import { useAtom } from 'jotai'
import { createApi } from 'lib/polkadotApi'
import { getSigner } from 'lib/polkadotExtension'
import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react'

const baseURL = '/'
const CONTRACT_ID = 420

const Game = ({api, phala}: {api: ApiPromise; phala: PhalaInstance}) => {
  const [account] = useAtom(accountAtom)
  const [number, setNumber] = useState('')
  const [certificateData, setCertificateData] = useState<CertificateData>()
  const [signCertificateLoading, setSignCertificateLoading] = useState(false)
  const [guessLoading, setGuessLoading] = useState(false)
  const [owner, setOwner] = useState('')
  const unsubscribe = useRef<() => void>()

  useEffect(() => {
    const _unsubscribe = unsubscribe.current
    return () => {
      api?.disconnect()
      _unsubscribe?.()
    }
  }, [api])

  useEffect(() => {
    setCertificateData(undefined)
  }, [account])

  const onSignCertificate = useCallback(async () => {
    if (account) {
      setSignCertificateLoading(true)
      try {
        const signer = await getSigner(account)
        setCertificateData(
          await signCertificate({
            api,
            account,
            signer,
          })
        )
        toaster.positive('Certificate signed', {})
      } catch (err) {
        toaster.negative((err as Error).message, {})
      }
      setSignCertificateLoading(false)
    }
  }, [api, account])

  const onGuess = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault()
      if (!certificateData) return
      setGuessLoading(true)
      const encodedQuery = api
        .createType('PastebinRequest', {
          head: {
            id: numberToHex(CONTRACT_ID, 256),
            nonce: hexAddPrefix(randomHex(32)),
          },
          data: {
            guess: {
              guess_number: Number(number),
            },
          },
        })
        .toHex()

      phala
        .query(encodedQuery, certificateData)
        .then((data) => {
          const {
            result: {ok, err},
          } = api
            .createType('PastebinResponse', hexAddPrefix(data))
            .toJSON() as any

          if (ok) {
            const {guessResult} = ok
            if (guessResult === 'Correct') {
              toaster.positive('Correct!', {})
              setNumber('')
            } else {
              toaster.info(guessResult, {})
            }
          }

          if (err) {
            throw new Error(err)
          }
        })
        .catch((err) => {
          toaster.negative((err as Error).message, {})
        })
        .finally(() => {
          setGuessLoading(false)
        })
    },
    [phala, api, number, certificateData]
  )

  const onReveal = useCallback(() => {
    if (!certificateData) return
    const encodedQuery = api
      .createType('PastebinRequest', {
        head: {
          id: numberToHex(CONTRACT_ID, 256),
          nonce: hexAddPrefix(randomHex(32)),
        },
        data: {peekRandomNumber: null},
      })
      .toHex()

    const toastKey = toaster.info('Cheating…', {autoHideDuration: 0})

    phala
      .query(encodedQuery, certificateData)
      .then((data) => {
        const {
          result: {ok, err},
        } = api
          .createType('PastebinResponse', hexAddPrefix(data))
          .toJSON() as any

        if (ok) {
          const revealResult = ok.randomNumber
          toaster.update(toastKey, {
            children: `Current number is ${revealResult}`,
            autoHideDuration: 3000,
          })
        }

        if (err) {
          throw new Error(err)
        }
      })
      .catch((err) => {
        toaster.update(toastKey, {
          kind: 'negative',
          children: (err as Error).message,
          autoHideDuration: 3000,
        })
      })
  }, [phala, api, certificateData])

  const onQueryOwner = useCallback(() => {
    if (!certificateData) return
    const encodedQuery = api
      .createType('PastebinRequest', {
        head: {
          id: numberToHex(CONTRACT_ID, 256),
          nonce: hexAddPrefix(randomHex(32)),
        },
        data: {queryOwner: null},
      })
      .toHex()

    const toastKey = toaster.info('Querying…', {autoHideDuration: 0})

    phala
      .query(encodedQuery, certificateData)
      .then((data) => {
        const {
          result: {ok, err},
        } = api
          .createType('PastebinResponse', hexAddPrefix(data))
          .toJSON() as any

        if (ok) {
          const result = ok.owner
          toaster.update(toastKey, {
            children: `Owner is ${result}`,
            autoHideDuration: 3000,
          })
        }

        if (err) {
          throw new Error(err)
        }
      })
      .catch((err) => {
        toaster.update(toastKey, {
          kind: 'negative',
          children: (err as Error).message,
          autoHideDuration: 3000,
        })
      })
  }, [phala, api, certificateData])

  const onReset = useCallback(async () => {
    if (!account) return
    const toastKey = toaster.info('Resetting…', {autoHideDuration: 0})
    const signer = await getSigner(account)
    const _unsubscribe = await phala
      .command({
        account,
        contractId: CONTRACT_ID,
        payload: api.createType('PastebinCommand', {NextRandom: null}).toHex(),
        signer,
        onStatus: (status) => {
          if (status.isFinalized) {
            toaster.update(toastKey, {
              kind: 'positive',
              children: 'Command Sent',
              autoHideDuration: 3000,
            })
          }
        },
      })
      .catch((err) => {
        toaster.update(toastKey, {
          kind: 'negative',
          children: (err as Error).message,
          autoHideDuration: 3000,
        })
      })

    if (_unsubscribe) {
      unsubscribe.current = _unsubscribe
    }
  }, [phala, api, account])

  const onSetOwner = useCallback<FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault()
      if (!account) return
      const toastKey = toaster.info('Setting…', {autoHideDuration: 0})
      const signer = await getSigner(account)
      try {
        const decodedOwner = u8aToHex(decodeAddress(owner))
        const _unsubscribe = await phala.command({
          account,
          contractId: CONTRACT_ID,
          payload: api
            .createType('PastebinCommand', {SetOwner: {owner: decodedOwner}})
            .toHex(),
          signer,
          onStatus: (status) => {
            if (status.isFinalized) {
              toaster.update(toastKey, {
                kind: 'positive',
                children: 'Command Sent',
                autoHideDuration: 3000,
              })
              setOwner('')
            }
          },
        })

        if (_unsubscribe) {
          unsubscribe.current = _unsubscribe
        }
      } catch (err) {
        toaster.update(toastKey, {
          kind: 'negative',
          children: (err as Error).message,
          autoHideDuration: 3000,
        })
      }
    },
    [account, api, owner, phala]
  )

  return (
    <ProgressSteps
      current={certificateData ? 1 : 0}
      overrides={{
        Root: {
          style: {width: '100%'},
        },
      }}
    >
      <Step title="Sign Certificate">
        <ParagraphMedium>Click to sign a certificate first.</ParagraphMedium>
        <Button
          isLoading={signCertificateLoading}
          onClick={onSignCertificate}
          disabled={!account}
        >
          Sign Certificate
        </Button>
      </Step>
      <Step title="Play">
        <div>
          <form onSubmit={onGuess}>
            <FormControl
              label="Guess Number"
              caption="u32 from 0 to 4,294,967,295"
            >
              <Input
                autoFocus
                type="number"
                value={number}
                min={0}
                max={4294967295}
                step={1}
                onChange={(e) => setNumber(e.currentTarget.value)}
                overrides={{Root: {style: {width: '500px'}}}}
              ></Input>
            </FormControl>
            <Button type="submit" disabled={!number} isLoading={guessLoading}>
              Guess
            </Button>
          </form>

          <form onSubmit={onSetOwner}>
            <FormControl label="Set Owner">
              <Input
                value={owner}
                onChange={(e) => setOwner(e.currentTarget.value)}
                overrides={{Root: {style: {width: '500px'}}}}
              ></Input>
            </FormControl>
            <Button type="submit" disabled={!owner}>
              Set
            </Button>
          </form>

          <ButtonGroup
            size="mini"
            overrides={{Root: {style: {marginTop: '16px'}}}}
          >
            <Button onClick={onQueryOwner}>Query Owner</Button>
            <Button onClick={onReset}>Reset Number</Button>
            <Button onClick={onReveal}>↑↑↓↓←→←→BA</Button>
          </ButtonGroup>
        </div>
      </Step>
    </ProgressSteps>
  )
}

const Pastebin: Page = () => {
  const [api, setApi] = useState<ApiPromise>()
  const [phala, setPhala] = useState<PhalaInstance>()

  useEffect(() => {
    createApi({
      endpoint: process.env.NEXT_PUBLIC_WS_ENDPOINT as string,
      types: {
        RandomNumber: 'u32',

        PostId: 'String',
        PostContent: 'String',
        CreateOn: 'u64',

        ContractOwner: {owner: 'AccountId'},
        Guess: {guess_number: 'RandomNumber'},

        CreatePostRequest: {
          owner: 'AccountId',
          readable_by: 'AccountId',
          content: 'String',
        },

        Post: {
          id: 'PostId',
          content: 'PostContent',
          owner: 'AccountId',
          readable_by: 'AccountId',
          created_on: 'CreateOn',
        },

        GuessResult: {
          _enum: ['TooLarge', 'ToSmall', 'Correct'],
        },
        GuessError: {
          _enum: ['OriginUnavailable', 'NotAuthorized'],
        },
        PastebinRequestData: {
          _enum: {
            QueryOwner: null,
            QueryPost: null,
            Guess: 'Guess',
            PeekRandomNumber: null,
          },
        },
        PastebinResponseData: {
          _enum: {
            Owner: 'AccountId',
            GuessResult: 'GuessResult',
            RandomNumber: 'RandomNumber',
            Post: 'Post',
          },
        },
        PastebinRequest: {
          head: 'ContractQueryHead',
          data: 'PastebinRequestData',
        },
        PastebinResponse: {
          nonce: '[u8; 32]',
          result: 'Result<PastebinResponseData, GuessError>',
        },
        PastebinCommand: {
          _enum: {
            NextRandom: null,
            SetOwner: 'ContractOwner',
            CreatePost: 'CreatePostRequest',
          },
        },
      },
    })
      .then((api) => {
        setApi(api)
        return createPhala({api, baseURL}).then((phala) => {
          setPhala(() => phala)
        })
      })
      .catch((err) => {
        toaster.negative((err as Error).message, {})
      })
  }, [])

  if (api && phala) {
    return <Game api={api} phala={phala} />
  }

  return (
    <Block
      display="flex"
      flexDirection="column"
      alignItems="center"
      height="280px"
      justifyContent="center"
    >
      <StyledSpinnerNext />
      <LabelXSmall marginTop="20px">Initializing</LabelXSmall>
    </Block>
  )
}

Pastebin.title = 'Guess Number'

export default Pastebin
