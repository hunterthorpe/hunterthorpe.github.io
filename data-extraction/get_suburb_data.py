import pandas as pd

# Load the CSV file into a DataFrame
df = pd.read_csv('suburb-council-game/data-extraction/SAL_2021_AUST.csv')

# Filter the DataFrame to keep only records where STATE_CODE_2021 == 2
filtered_df = df[df['STATE_CODE_2021'] == 2]

# Drop duplicates to get unique SAL_CODE_2021 and their associated SAL_NAME_2021
unique_sal_codes = filtered_df[['SAL_CODE_2021', 'SAL_NAME_2021']].drop_duplicates()

# List of suburbs to check
suburbs_to_check = [
    "Melbourne", "St Kilda", "Richmond", "Frankston", "Carlton", "North Melbourne",
    "Brighton", "Dandenong", "South Melbourne", "Collingwood", "Hawthorn", "Essendon",
    "Port Melbourne", "Footscray", "Fitzroy", "Docklands", "Toorak", "Box Hill", "Brunswick",
    "South Yarra", "Werribee", "Williamstown", "Kew", "East Melbourne", "Glen Waverley",
    "Sunshine", "Ringwood", "Altona", "Preston", "Doncaster", "West Melbourne", "Camberwell",
    "Cranbourne", "Clayton", "Malvern", "Coburg", "Pakenham", "Lilydale", "Caulfield",
    "Heidelberg", "Albert Park", "Southbank", "Sandringham", "Prahran", "Chadstone",
    "Moonee Ponds", "Flemington", "Oakleigh", "Parkville", "Eltham", "Northcote", "Springvale",
    "Glen Iris", "Blackburn", "Broadmeadows", "Tullamarine", "Moorabbin", "Epping",
    "Chelsea", "Mount Waverley", "Burwood", "Ivanhoe", "Kensington", "Brunswick East",
    "Greensborough", "Craigieburn", "Reservoir", "Yarraville", "Point Cook", "Bundoora",
    "Elwood", "Keilor", "Malvern East", "Ferntree Gully", "Carlton North", "Belgrave",
    "St Kilda East", "Balwyn", "Frankston South", "Mentone", "Dandenong South", "Kew East",
    "Brunswick West", "Hampton", "Brighton East", "Bentleigh", "Hoppers Crossing",
    "Hawthorn East", "Fitzroy North", "Black Rock", "Doncaster East", "Box Hill North",
    "Thornbury", "Thomastown", "Templestowe", "Pascoe Vale", "Airport West", "Ascot Vale",
    "Narre Warren", "West Footscray", "Elsternwick", "Mernda", "Croydon", "Abbotsford",
    "Burnley", "Surrey Hills", "Mordialloc", "Clifton Hill", "Nunawading", "Cheltenham",
    "Windsor", "Vermont", "South Morang", "Carrum", "Box Hill South", "Berwick", "Officer",
    "Dandenong North", "Middle Park", "Altona North", "Ringwood East", "Fairfield",
    "Frankston North", "Balwyn North", "Mount Eliza", "Carnegie", "Mitcham", "St Albans",
    "Canterbury", "Coburg North", "Maribyrnong", "Warrandyte", "Ashburton", "St Kilda West",
    "Deer Park", "Seaford", "Sunshine West", "Alphington", "Tarneit", "Armadale",
    "Wantirna", "Newport", "Mont Albert", "Balaclava", "Cremorne", "Hurstbridge",
    "Rowville", "Diamond Creek", "Laverton", "Caroline Springs", "Bulleen", "Caulfield South",
    "Caulfield North", "Noble Park", "Bayswater", "Spotswood", "South Wharf", "Blackburn South",
    "Blackburn North", "Burwood East", "Clayton South", "Rosanna", "Donvale", "Cranbourne East",
    "Fawkner", "Boronia", "Carrum Downs", "Cranbourne North", "Keilor East", "Edithvale",
    "Oakleigh South", "Cranbourne South", "Heidelberg West", "Lalor", "Ringwood North",
    "Vermont South", "Truganina", "Aspendale", "Cranbourne West", "Roxburgh Park",
    "Sunshine North", "Taylors Lakes", "Caulfield East", "Bentleigh East", "Seddon",
    "Essendon North", "Glenroy", "Mulgrave", "Williamstown North", "Keysborough",
    "Upper Ferntree Gully", "Murrumbeena", "Beaumaris", "Mill Park", "Kooyong",
    "Altona Meadows", "Wantirna South", "Parkdale", "Beaconsfield", "Watsonia", "Ripponlea",
    "Brooklyn", "Wheelers Hill", "Ormond", "Clyde", "Keilor Downs", "Campbellfield",
    "Ashwood", "Greenvale", "Plenty", "Upwey", "Princes Hill", "Highett", "Doreen",
    "Wyndham Vale", "Springvale South", "Bonbeach", "Macleod", "Glen Huntly", "Ivanhoe East",
    "Montmorency", "Heidelberg Heights", "Eltham North", "Huntingdale", "Strathmore",
    "Mooroolbark", "Deepdene", "Narre Warren North", "Croydon North", "Hallam",
    "Oakleigh East", "Essendon West", "Narre Warren South", "Lower Plenty",
    "Templestowe Lower", "Williams Landing", "Hughesdale", "Tottenham", "Forest Hill",
    "Gardenvale", "Eaglemont", "Croydon South", "Tecoma", "Knoxfield", "Lysterfield",
    "Pascoe Vale South", "Clyde North", "Travancore", "Kilsyth", "Kingsville",
    "Wollert", "McKinnon", "Patterson Lakes", "Heathmont", "Keilor Park", "Langwarrin",
    "Research", "Seaholme", "Scoresby", "Dallas", "Coolaroo", "Westmeadows",
    "Hampton East", "Braybrook", "Dingley Village", "Jacana", "Endeavour Hills",
    "Hampton Park", "Laverton North", "Chirnside Park", "Albion", "Derrimut",
    "Mickleham", "Oak Park", "Avondale Heights", "Maidstone", "Niddrie", "Sydenham",
    "Chelsea Heights", "Park Orchards", "North Warrandyte", "Doveton", "Skye",
    "The Basin", "Belgrave South", "Mont Albert North", "Aberfeldie", "Ardeer",
    "Taylors Hill", "Kingsbury", "Bayswater North", "Notting Hill", "Warrandyte South",
    "Montrose", "Croydon Hills", "Wattle Glen", "St Helena", "Warranwood", "Watsonia North",
    "Wonga Park", "Braeside", "Mount Evelyn", "Noble Park North", "Aspendale Gardens",
    "Bellfield", "Briar Hill", "Lynbrook", "Burnside", "Seabrook", "Heatherton",
    "Clarinda", "Meadow Heights", "South Kingsville", "Gladstone Park", "Viewbank",
    "Hadfield", "Yallambie", "Belgrave Heights", "Hillside", "Kilsyth South",
    "Keilor Lodge", "Lyndhurst", "Strathmore Heights", "Waterways", "Manor Lakes",
    "Kealba", "Kings Park", "Eumemmerring", "Cairnlea", "Selby", "Gowanbrae",
    "Attwood", "Lysterfield South", "Delahey", "Albanvale", "Bangholme", "Burnside Heights",
    "Junction Village", "Botanic Ridge", "Sandhurst", "Fraser Rise"
]

# Function to clean suburb names by removing " (Vic.)"
def clean_suburb_name(name):
    return name.replace(" (Vic.)", "").strip()

# Apply the cleaning function to the 'SUBURB_NAME' column in the DataFrame
df['CLEANED_SUBURB_NAME'] = df['SAL_NAME_2021'].apply(clean_suburb_name)

# Get the unique suburbs from the DataFrame
suburbs_in_df = df['CLEANED_SUBURB_NAME'].unique()

# Convert to a set for easier comparison
suburbs_in_df_set = set(suburbs_in_df)
suburbs_to_check_set = set(suburbs_to_check)

# Suburbs that are in the DataFrame
suburbs_in_df_final = suburbs_to_check_set.intersection(suburbs_in_df_set)

# Suburbs that are not in the DataFrame
suburbs_not_in_df_final = suburbs_to_check_set.difference(suburbs_in_df_set)

# Print results
print("Suburbs in DataFrame:")
print(suburbs_in_df_final)

print("\nSuburbs not in DataFrame:")
print(suburbs_not_in_df_final)


print("Suburbs in DataFrame with SAL_CODE_2021:")
for suburb in suburbs_in_df_final:
    # Filter the DataFrame for the suburb
    suburb_df = df[df['CLEANED_SUBURB_NAME'] == suburb]
    
    # Assuming SAL_CODE_2021 is unique for each suburb

    sal_code = suburb_df['SAL_CODE_2021'].iloc[0]
    
    # Print the suburb with its SAL_CODE_2021
    print(f"\"{suburb}\": {sal_code},")