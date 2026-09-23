// Banking details still holding the placeholder account number (e.g. 0000000000).
export const PLACEHOLDER_ACC = /0{6,}/

// Terms printed on every quote. Edit this list to change them everywhere.
// {deposit} is replaced with the quote's deposit percentage.
export const QUOTE_TERMS: string[] = [
  'All prices are in South African Rand and exclude VAT (NextGen is not VAT registered).',
  'This quote is valid until the date shown above.',
  'A {deposit}% deposit confirms the booking. The balance is payable on completion.',
  'Work is scheduled once the deposit reflects in our account. Please use the quote number as your payment reference.',
  'Exterior painting, waterproofing and paving may be rescheduled for rain at no extra cost.',
  'Any work outside the scope above is quoted and agreed in writing before it starts.',
  'A flat R350 callout fee applies outside the Helderberg Basin.',
]
