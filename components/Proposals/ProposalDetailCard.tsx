import { useCallback, useState } from 'react';
import { Button, Fieldset, Group, Loader, Stack, Text, TextInput } from '@mantine/core';
import Link from 'next/link';
import { IconExternalLink } from '@tabler/icons-react';
import { useProposal } from '@/hooks/useProposal';
import { useTokens } from '@/hooks/useTokens';
import { useTokenAmount } from '@/hooks/useTokenAmount';
// import { TWAPOracle, LeafNode } from '@/lib/types';
import { ProposalOrdersCard } from './ProposalOrdersCard';
import { ConditionalMarketCard } from '../Markets/ConditionalMarketCard';

export function ProposalDetailCard({ proposalNumber }: { proposalNumber: number }) {
  const { proposal, markets, orders, mintTokens, placeOrder, loading } = useProposal({
    fromNumber: proposalNumber,
  });
  const [mintBaseAmount, setMintBaseAmount] = useState<number>();
  const [mintQuoteAmount, setMintQuoteAmount] = useState<number>();
  const { amount: baseAmount } = useTokenAmount(markets?.baseVault.underlyingTokenMint);
  const { amount: basePassAmount } = useTokenAmount(
    markets?.baseVault.conditionalOnFinalizeTokenMint,
  );
  const { amount: baseFailAmount } = useTokenAmount(
    markets?.baseVault.conditionalOnRevertTokenMint,
  );
  const { amount: quoteAmount } = useTokenAmount(markets?.quoteVault.underlyingTokenMint);
  const { amount: quotePassAmount } = useTokenAmount(
    markets?.quoteVault.conditionalOnFinalizeTokenMint,
  );
  const { amount: quoteFailAmount } = useTokenAmount(
    markets?.quoteVault.conditionalOnRevertTokenMint,
  );
  const { tokens } = useTokens();

  const handleMint = useCallback(
    async (fromBase?: boolean) => {
      if ((!mintBaseAmount && fromBase) || (!mintQuoteAmount && !fromBase)) return;

      if (fromBase) {
        await mintTokens(mintBaseAmount!, true);
      } else {
        await mintTokens(mintQuoteAmount!, false);
      }
    },
    [mintTokens, mintBaseAmount, mintQuoteAmount],
  );

  // const calculateTWAP = (twapOracle: TWAPOracle) => {
  //   const slotsPassed = twapOracle.lastUpdatedSlot.sub(twapOracle.initialSlot);
  //   const twapValue = twapOracle.observationAggregator.div(slotsPassed);
  //   return twapValue.toString();
  // };

  // const passTwap = markets ? calculateTWAP(markets.passTwap.twapOracle) : null;
  // const failTwap = markets ? calculateTWAP(markets.failTwap.twapOracle) : null;

  return !proposal || !markets ? (
    <Group justify="center">
      <Loader />
    </Group>
  ) : (
    <Stack gap="0">
      <Text fw="bolder" size="xl">
        Proposal #{proposal.account.number}
      </Text>
      <Link href={proposal.account.descriptionUrl}>
        <Group gap="sm">
          <Text>Go to description</Text>
          <IconExternalLink />
        </Group>
      </Link>
      <Stack>
        {markets ? (
          <Group gap="md" justify="space-around" p="sm">
            <ConditionalMarketCard
              isPassMarket
              markets={markets}
              proposal={proposal}
              placeOrder={placeOrder}
            />
            <ConditionalMarketCard
              isPassMarket={false}
              markets={markets}
              proposal={proposal}
              placeOrder={placeOrder}
            />
          </Group>
        ) : null}
        <Group justify="space-around">
          <Fieldset legend={`Mint conditional $${tokens?.meta?.symbol}`}>
            <TextInput
              label="Amount"
              description={`Balance: ${baseAmount?.uiAmountString || 0} $${tokens?.meta?.symbol}`}
              placeholder="Amount to mint"
              type="number"
              onChange={(e) => setMintBaseAmount(Number(e.target.value))}
            />
            <Text fw="lighter" size="sm" c="green">
              Balance: {basePassAmount?.uiAmountString || 0} $p{tokens?.meta?.symbol}
            </Text>
            <Text fw="lighter" size="sm" c="red">
              Balance: {baseFailAmount?.uiAmountString || 0} $f{tokens?.meta?.symbol}
            </Text>
            <Button
              mt="md"
              disabled={(mintBaseAmount || 0) <= 0}
              onClick={() => handleMint(true)}
              loading={loading}
              fullWidth
            >
              Mint
            </Button>
          </Fieldset>
          <Fieldset legend={`Mint conditional $${tokens?.usdc?.symbol}`}>
            <TextInput
              label="Amount"
              description={`Balance: ${quoteAmount?.uiAmountString || 0} $${tokens?.usdc?.symbol}`}
              placeholder="Amount to mint"
              type="number"
              onChange={(e) => setMintQuoteAmount(Number(e.target.value))}
            />
            <Text fw="lighter" size="sm" c="green">
              Balance: {quotePassAmount?.uiAmountString || 0} $p{tokens?.usdc?.symbol}
            </Text>
            <Text fw="lighter" size="sm" c="red">
              Balance: {quoteFailAmount?.uiAmountString || 0} $f{tokens?.usdc?.symbol}
            </Text>
            <Button
              mt="md"
              disabled={(mintQuoteAmount || 0) <= 0}
              loading={loading}
              onClick={() => handleMint(false)}
              fullWidth
            >
              Mint
            </Button>
          </Fieldset>
        </Group>
        {proposal && orders ? (
          <ProposalOrdersCard markets={markets} proposal={proposal} orders={orders} />
        ) : null}
      </Stack>
    </Stack>
  );
}
