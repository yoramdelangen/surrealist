import { Box, Button, Collapse, Divider, Group, SimpleGrid, Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { fetchAPI } from "~/screens/cloud-panel/api";
import { useCloudInstancesQuery } from "~/screens/cloud-panel/hooks/instances";
import { useCloudTypeLimits } from "~/screens/cloud-panel/hooks/limits";
import type { CloudInstance } from "~/types";
import { iconChevronLeft, iconChevronRight } from "~/util/icons";
import { EstimatedCost } from "../../EstimatedCost";
import { InstanceCategoryPicker } from "../../InstanceCategoryPicker";
import { InstanceType } from "../../InstanceType";

export async function openInstanceTypeModal(instance: CloudInstance) {
	openModal({
		size: "lg",
		children: <InstanceTypeModal instance={instance} />,
	});
}

interface InstanceTypeModalProps {
	instance: CloudInstance;
}

function InstanceTypeModal({ instance }: InstanceTypeModalProps) {
	const instanceTypes = useAvailableInstanceTypes();
	const organization = useOrganization();

	const hasBilling = (organization?.billing_info && organization?.payment_info) ?? false;

	const [category, setCategory] = useState("");
	const [instanceType, setInstanceType] = useState("");

	const { data: instances } = useCloudInstancesQuery(organization?.id);
	const isAvailable = useCloudTypeLimits(instances ?? []);

	const instanceInfo = instanceTypes.find((type) => type.slug === instanceType);
	const filteredTypes = instanceTypes.filter((type) => type.category === category);

	const { mutateAsync, isPending } = useMutation({
		mutationFn: (slug: string) =>
			fetchAPI(`/instances/${instance.id}/type`, {
				method: "PATCH",
				body: JSON.stringify({
					slug,
				}),
			}),
	});

	const requestChange = useStable(() => {
		mutateAsync(instanceType).then(() => {
			closeAllModals();
		});
	});

	return (
		<Stack>
			{category ? (
				<>
					<Group mb="md">
						<Box flex={1}>
							<PrimaryTitle>Select instance type</PrimaryTitle>
							<Text fz="lg">{instance.name}</Text>
						</Box>
						<Box>
							<Button
								leftSection={<Icon path={iconChevronLeft} />}
								color="slate"
								variant="subtle"
								py={0}
								onClick={() => {
									setCategory("");
									setInstanceType("");
								}}
							>
								Change category
							</Button>
						</Box>
					</Group>
					<SimpleGrid cols={{ base: 1, md: 2 }}>
						{filteredTypes.map((type) => (
							<InstanceType
								key={type.slug}
								type={type}
								isActive={type.slug === instanceType}
								isLimited={!isAvailable(type)}
								onSelect={() => setInstanceType(type.slug)}
								onBody
							/>
						))}
					</SimpleGrid>

					<Collapse in={!!instanceInfo}>
						<Divider my="md" />
						<EstimatedCost
							type={instanceInfo}
							units={instance.compute_units}
						/>
					</Collapse>
				</>
			) : (
				<>
					<Box mb="md">
						<PrimaryTitle>Select instance category</PrimaryTitle>
						<Text fz="lg">{instance.name}</Text>
					</Box>
					{organization && (
						<InstanceCategoryPicker
							organization={organization}
							value={category}
							onChange={setCategory}
							onBody
						/>
					)}
				</>
			)}

			<Group mt="md">
				<Button
					onClick={() => closeAllModals()}
					color="slate"
					variant="light"
					flex={1}
				>
					Close
				</Button>
				<Button
					type="submit"
					variant="gradient"
					onClick={requestChange}
					disabled={!instanceType || instance.type.slug === instanceType}
					loading={isPending}
					flex={1}
				>
					Save changes
				</Button>
			</Group>
		</Stack>
	);
}