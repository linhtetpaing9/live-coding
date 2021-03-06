import React, {
    FC,
    useCallback,
    useEffect,
    SyntheticEvent,
    ChangeEvent,
} from "react"
import useModels from "@packages/react-use-models"
import useValidator from "@packages/react-joi"
import Joi from "joi"
import {
    validateCardNumber,
    formatCardNumber,
    formatCardExpiry,
    parseCardType,
    validateCardExpiry,
    validateCardCVC,
} from "creditcardutils"

// Styled Elements
import {
    Actions,
    Container,
    Fields,
    ErrorMessage,
    FieldControl,
    FieldLabel,
    Input,
    Form,
    FieldGroups,
    FieldsMerge,
} from "./index.styled"

type TypeCheckoutFormDefaultValues = {
    email: string | null
    card_number: string | null
    card_expire: string | null
    cvv: string | null
}

export type TypeCheckoutFormValues = NonNullable<TypeCheckoutFormDefaultValues>

export interface CheckoutFormProps {
    onSuccess: (values: TypeCheckoutFormValues) => void
    loading?: boolean
    submitText?: string
}

const defaultState: TypeCheckoutFormDefaultValues = {
    email: null,
    card_number: null,
    card_expire: null,
    cvv: null,
}

const CheckoutForm: FC<CheckoutFormProps> = ({
    onSuccess,
    loading = false,
    submitText = "Submit",
}) => {
    const { models, register, updateModel } =
        useModels<TypeCheckoutFormDefaultValues>({
            defaultState,
        })
    const { state, setData } = useValidator({
        initialData: defaultState,
        schema: Joi.object({
            email: Joi.string()
                .email({
                    tlds: { allow: false },
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.email": "Must be a valid email",
                    "any.required": "Required",
                }),
            card_number: Joi.string()
                .custom((value, helpers) => {
                    if (value) {
                        if (!validateCardNumber(value)) {
                            return helpers.error("string.cardNumber")
                        }
                    }

                    return value
                })
                .custom((value, helpers) => {
                    const cardType: string = parseCardType(value)

                    const validateCardType = (cardType: string) => {
                        const allowTypes: string[] = ["visa", "mastercard"]
                        return allowTypes.some((type) => type === cardType)
                    }

                    if (value) {
                        if (!validateCardType(cardType)) {
                            return helpers.error("string.cardType")
                        }
                    }

                    return value
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.cardNumber": "Must be a valid card",
                    "string.cardType":
                        "Must be a valid card type (only allow visa, mastercard)",
                    "any.required": "Required",
                }),
            card_expire: Joi.string()
                .custom((value, helpers) => {
                    const [month, year] = value
                        .split("/")
                        .map((item: string) => item.trim())
                    if (value) {
                        if (!validateCardExpiry(month, year)) {
                            return helpers.error("string.expiry")
                        }
                    }

                    return value
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.expiry": "Must be valid date",
                    "any.required": "Required",
                }),
            cvv: Joi.string()
                .custom((value, helpers) => {
                    const cardType: string = parseCardType(value)

                    if (value) {
                        if (!validateCardCVC(value, cardType)) {
                            return helpers.error("string.cvc")
                        }
                    }

                    return value
                })
                .length(3)
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.length": "Maximum 3 digits",
                    "string.cvc": "Must be valid cvc",
                    "any.required": "Required",
                }),
        }),
    })

    const getErrors = useCallback(
        (field) => {
            return state.$errors[field]
                .map((data: any) => data.$message)
                .join(",")
        },
        [state.$errors]
    )

    const onSubmit = (e: SyntheticEvent) => {
        e.preventDefault()

        onSuccess(state.$data)
    }

    const displayCardTypes = (
        value: TypeCheckoutFormDefaultValues,
        type: string
    ) => {
        const cardType = parseCardType(value.card_number)
        if (cardType != null && cardType == type) {
            return `active-${type}`
        }
        return ""
    }

    const formatter = {
        cardNumber: (e: ChangeEvent<HTMLInputElement>) => {
            const value = formatCardNumber(e.target.value)

            updateModel("card_number", value)
        },
        cardExpire: (e: ChangeEvent<HTMLInputElement>) => {
            const value = formatCardExpiry(e.target.value)

            updateModel("card_expire", value)
        },
    }

    // Sync model <-> validator
    useEffect(() => {
        setData(models)
    }, [models])

    return (
        <Container>
            <Form onSubmit={onSubmit}>
                <Fields>
                    <FieldControl>
                        <FieldLabel error={!!getErrors("email")}>
                            Email
                        </FieldLabel>

                        <Input
                            {...register.input({ name: "email" })}
                            type="email"
                            placeholder="you@company.com"
                            autoComplete="current-email"
                        />
                    </FieldControl>

                    {getErrors("email") && (
                        <ErrorMessage>{getErrors("email")}</ErrorMessage>
                    )}
                </Fields>

                <FieldGroups>
                    <Fields>
                        <FieldControl>
                            <FieldLabel error={!!getErrors("card_number")}>
                                Card information
                            </FieldLabel>

                            <div className="input-card-number">
                                <Input
                                    {...register.input({
                                        name: "card_number",
                                        onChange: formatter.cardNumber,
                                    })}
                                    type="text"
                                    placeholder="1234 1234 1234 1234"
                                />
                                <div className="input-card-img">
                                    <img
                                        className={displayCardTypes(
                                            state.$data,
                                            "visa"
                                        )}
                                        src="/visa.png"
                                    />
                                    <img
                                        className={displayCardTypes(
                                            state.$data,
                                            "mastercard"
                                        )}
                                        src="/mastercard.png"
                                    />
                                </div>
                            </div>
                        </FieldControl>

                        {getErrors("card_number") && (
                            <ErrorMessage>
                                {getErrors("card_number")}
                            </ErrorMessage>
                        )}
                    </Fields>

                    <FieldsMerge>
                        <Fields>
                            <Input
                                {...register.input({
                                    name: "card_expire",
                                    onChange: formatter.cardExpire,
                                })}
                                type="text"
                                placeholder="MM / YY"
                            />

                            {getErrors("card_expire") && (
                                <ErrorMessage>
                                    {getErrors("card_expire")}
                                </ErrorMessage>
                            )}
                        </Fields>

                        <Fields>
                            <Input
                                {...register.input({ name: "cvv" })}
                                type="text"
                                placeholder="123"
                            />

                            {getErrors("cvv") && (
                                <ErrorMessage>{getErrors("cvv")}</ErrorMessage>
                            )}
                        </Fields>
                    </FieldsMerge>
                </FieldGroups>

                <Actions>
                    <button
                        className="btn-submit"
                        disabled={state.$auto_invalid || loading}
                    >
                        {submitText}
                    </button>
                </Actions>
            </Form>
        </Container>
    )
}

export default CheckoutForm
