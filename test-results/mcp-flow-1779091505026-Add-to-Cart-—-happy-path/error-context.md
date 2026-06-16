# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mcp-flow-1779091505026.spec.js >> Add to Cart — happy path
- Location: temp-specs\mcp-flow-1779091505026.spec.js:126:1

# Error details

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /add\s+to\s+cart/i }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - text: A HomeClick.com Website
    - generic [ref=e4]:
      - text: "Talk to an Expert:"
      - 'link "(916) ###-####" [ref=e5] [cursor=pointer]':
        - /url: tel:+19160000000
  - generic [ref=e6]:
    - banner [ref=e7]:
      - link "Home" [ref=e9] [cursor=pointer]:
        - /url: /
        - img "Home" [ref=e10]
      - generic [ref=e11]:
        - combobox "Submit" [ref=e13]:
          - search [ref=e14]:
            - generic "Submit" [ref=e16]:
              - button "Submit" [ref=e17] [cursor=pointer]:
                - img [ref=e18]
            - searchbox "Submit" [ref=e21]
        - navigation [ref=e22]:
          - generic [ref=e23]:
            - button "Support" [ref=e24] [cursor=pointer]:
              - img [ref=e25]
              - text: Support
            - button "Account" [ref=e27] [cursor=pointer]:
              - img [ref=e28]
              - text: Account
        - navigation [ref=e30]:
          - status [ref=e31]:
            - link "(0)" [ref=e32] [cursor=pointer]:
              - /url: /cart
              - img [ref=e34]
              - generic [ref=e36]: (0)
    - complementary [ref=e37]:
      - generic [ref=e38]:
        - img "Homeclick" [ref=e39]
        - button "Close menu" [ref=e40] [cursor=pointer]:
          - img [ref=e41]
      - navigation:
        - list
    - generic [ref=e44]:
      - navigation [ref=e45]:
        - list [ref=e46]:
          - listitem [ref=e47]:
            - link "Indoor Lighting" [ref=e48] [cursor=pointer]:
              - /url: /c/indoor-lighting
          - listitem [ref=e49]:
            - link "Outdoor Lighting" [ref=e50] [cursor=pointer]:
              - /url: /c/outdoor-lighting
          - listitem [ref=e51]:
            - link "Fans" [ref=e52] [cursor=pointer]:
              - /url: /c/fans
          - listitem [ref=e53]:
            - link "Outdoor Living" [ref=e54] [cursor=pointer]:
              - /url: /c/outdoor-living
          - listitem [ref=e55]:
            - link "Decor" [ref=e56] [cursor=pointer]:
              - /url: /c/decor
            - generic [ref=e57]:
              - button "Close menu" [ref=e58] [cursor=pointer]:
                - img [ref=e59]
              - generic [ref=e61]:
                - list [ref=e62]:
                  - listitem [ref=e63]:
                    - link "Mirrors" [ref=e64] [cursor=pointer]:
                      - /url: /c/mirrors
                    - list [ref=e65]:
                      - listitem [ref=e66]:
                        - link "Wall Mirrors" [ref=e67] [cursor=pointer]:
                          - /url: /c/wall-mirrors
                      - listitem [ref=e68]:
                        - link "Free Standing Mirrors" [ref=e69] [cursor=pointer]:
                          - /url: /c/free-standing-mirrors
                  - listitem [ref=e70]:
                    - link "Fireplace Accessories" [ref=e71] [cursor=pointer]:
                      - /url: /c/fireplace-accessories
                    - list [ref=e72]:
                      - listitem [ref=e73]:
                        - link "Fireplace Screens" [ref=e74] [cursor=pointer]:
                          - /url: /c/fireplace-screens
                      - listitem [ref=e75]:
                        - link "Fireplace Tools" [ref=e76] [cursor=pointer]:
                          - /url: /c/fireplace-tools
                - list [ref=e77]:
                  - listitem [ref=e78]:
                    - link "Home Decor" [ref=e79] [cursor=pointer]:
                      - /url: /c/decor
                    - list [ref=e80]:
                      - listitem [ref=e81]:
                        - link "Candles and Holders" [ref=e82] [cursor=pointer]:
                          - /url: /c/candles-and-holders
                      - listitem [ref=e83]:
                        - link "Vases" [ref=e84] [cursor=pointer]:
                          - /url: /c/vases
                      - listitem [ref=e85]:
                        - link "Figures and Statues" [ref=e86] [cursor=pointer]:
                          - /url: /c/figurines-and-statues
                      - listitem [ref=e87]:
                        - link "Sculptures and Objects" [ref=e88] [cursor=pointer]:
                          - /url: /c/sculptures-and-objects
                      - listitem [ref=e89]:
                        - link "Bookends" [ref=e90] [cursor=pointer]:
                          - /url: /c/bookends
                  - listitem [ref=e91]:
                    - link "Wall Decor and Art" [ref=e92] [cursor=pointer]:
                      - /url: /c/wall-decor
                    - list [ref=e93]:
                      - listitem [ref=e94]:
                        - link "Framed Prints" [ref=e95] [cursor=pointer]:
                          - /url: /c/framed-print
                      - listitem [ref=e96]:
                        - link "Framed Displays" [ref=e97] [cursor=pointer]:
                          - /url: /c/framed-display
                      - listitem [ref=e98]:
                        - link "Wall Signs" [ref=e99] [cursor=pointer]:
                          - /url: /c/wall-signs
                - list [ref=e100]:
                  - listitem [ref=e101]:
                    - link [ref=e102] [cursor=pointer]:
                      - /url: /p/captarent-66-1-led-rectangular-mirror-in-contemporary-style-42-inches-tall-and-2-19-inches-wide-p300470-030-cs?184289=671593
                    - figure [ref=e103]:
                      - link [ref=e104] [cursor=pointer]:
                        - /url: /p/captarent-66-1-led-rectangular-mirror-in-contemporary-style-42-inches-tall-and-2-19-inches-wide-p300470-030-cs?184289=671593
                    - generic [ref=e105]: Progress LED Mirror P300470-030-CS
                    - link "Shop Now" [ref=e106] [cursor=pointer]:
                      - /url: /p/captarent-66-1-led-rectangular-mirror-in-contemporary-style-42-inches-tall-and-2-19-inches-wide-p300470-030-cs?184289=671593
      - navigation [ref=e107]:
        - list [ref=e108]:
          - listitem [ref=e109]:
            - link "New" [ref=e110] [cursor=pointer]:
              - /url: /new
          - listitem [ref=e111]:
            - link "Sale" [ref=e112] [cursor=pointer]:
              - /url: /sale
          - listitem [ref=e113]:
            - link "Blog" [ref=e114] [cursor=pointer]:
              - /url: /blog
          - listitem [ref=e115]:
            - link "Our Brands" [ref=e116] [cursor=pointer]:
              - /url: /brands
  - main [ref=e117]:
    - generic [ref=e118]:
      - navigation "breadcrumb" [ref=e120]:
        - list [ref=e121]:
          - listitem [ref=e122]:
            - link "Home" [ref=e123] [cursor=pointer]:
              - /url: /
            - text: /
          - listitem [ref=e124]:
            - link "Decor" [ref=e125] [cursor=pointer]:
              - /url: /c/decor
            - text: /
          - listitem [ref=e126]:
            - link "Mirrors" [ref=e127] [cursor=pointer]:
              - /url: /c/mirrors
            - text: /
          - listitem [ref=e128]:
            - link "Wall Mirrors" [disabled] [ref=e129]
      - heading "Wall Mirrors" [level=1] [ref=e131]
      - complementary [ref=e132]:
        - button "✕" [ref=e133] [cursor=pointer]
        - heading "Filter and Sort" [level=3] [ref=e134]
        - generic [ref=e135]:
          - generic [ref=e136]:
            - generic "Category" [ref=e137]:
              - generic [ref=e138] [cursor=pointer]:
                - generic [ref=e139]: Category
                - generic [ref=e140]: +
            - generic "Brand" [ref=e141]:
              - generic [ref=e142] [cursor=pointer]:
                - generic [ref=e143]: Brand
                - generic [ref=e144]: +
            - generic "Finish Color" [ref=e145]:
              - generic [ref=e146] [cursor=pointer]:
                - generic [ref=e147]: Finish Color
                - generic [ref=e148]: +
            - generic "Collection" [ref=e149]:
              - generic [ref=e150] [cursor=pointer]:
                - generic [ref=e151]: Collection
                - generic [ref=e152]: +
            - generic "Color Temperature" [ref=e153]:
              - generic [ref=e154] [cursor=pointer]:
                - generic [ref=e155]: Color Temperature
                - generic [ref=e156]: +
            - generic "Depth" [ref=e157]:
              - generic [ref=e158] [cursor=pointer]:
                - generic [ref=e159]: Depth
                - generic [ref=e160]: +
            - generic "Designer" [ref=e161]:
              - generic [ref=e162] [cursor=pointer]:
                - generic [ref=e163]: Designer
                - generic [ref=e164]: +
            - generic "Hanging Method" [ref=e165]:
              - generic [ref=e166] [cursor=pointer]:
                - generic [ref=e167]: Hanging Method
                - generic [ref=e168]: +
            - generic "Height" [ref=e169]:
              - generic [ref=e170] [cursor=pointer]:
                - generic [ref=e171]: Height
                - generic [ref=e172]: +
            - generic "Length" [ref=e173]:
              - generic [ref=e174] [cursor=pointer]:
                - generic [ref=e175]: Length
                - generic [ref=e176]: +
            - generic "Lumen Output" [ref=e177]:
              - generic [ref=e178] [cursor=pointer]:
                - generic [ref=e179]: Lumen Output
                - generic [ref=e180]: +
            - generic "Number of Lights" [ref=e181]:
              - generic [ref=e182] [cursor=pointer]:
                - generic [ref=e183]: Number of Lights
                - generic [ref=e184]: +
            - generic "Shape" [ref=e185]:
              - generic [ref=e186] [cursor=pointer]:
                - generic [ref=e187]: Shape
                - generic [ref=e188]: +
            - generic "Style" [ref=e189]:
              - generic [ref=e190] [cursor=pointer]:
                - generic [ref=e191]: Style
                - generic [ref=e192]: +
            - generic "Shade Material" [ref=e193]:
              - generic [ref=e194] [cursor=pointer]:
                - generic [ref=e195]: Shade Material
                - generic [ref=e196]: +
            - generic "Switch Type" [ref=e197]:
              - generic [ref=e198] [cursor=pointer]:
                - generic [ref=e199]: Switch Type
                - generic [ref=e200]: +
            - generic "Voltage Rating" [ref=e201]:
              - generic [ref=e202] [cursor=pointer]:
                - generic [ref=e203]: Voltage Rating
                - generic [ref=e204]: +
            - generic "Wattage" [ref=e205]:
              - generic [ref=e206] [cursor=pointer]:
                - generic [ref=e207]: Wattage
                - generic [ref=e208]: +
            - generic "Weight" [ref=e209]:
              - generic [ref=e210] [cursor=pointer]:
                - generic [ref=e211]: Weight
                - generic [ref=e212]: +
            - generic "Price" [ref=e213]:
              - generic [ref=e214] [cursor=pointer]:
                - generic [ref=e215]: Price
                - generic [ref=e216]: +
            - generic [ref=e218] [cursor=pointer]:
              - checkbox "Can be Recessed"
              - generic [ref=e219]: Can be Recessed
            - generic [ref=e221] [cursor=pointer]:
              - checkbox "Made in USA"
              - generic [ref=e222]: Made in USA
            - generic [ref=e224] [cursor=pointer]:
              - checkbox "Free Shipping"
              - generic [ref=e225]: Free Shipping
            - generic [ref=e227] [cursor=pointer]:
              - checkbox "In Stock"
              - generic [ref=e228]: In Stock
            - generic [ref=e230] [cursor=pointer]:
              - checkbox "Is New"
              - generic [ref=e231]: Is New
            - generic [ref=e233] [cursor=pointer]:
              - checkbox "Is Top Seller"
              - generic [ref=e234]: Is Top Seller
            - generic [ref=e236] [cursor=pointer]:
              - checkbox "On Clearance"
              - generic [ref=e237]: On Clearance
            - generic [ref=e239] [cursor=pointer]:
              - checkbox "On Sale"
              - generic [ref=e240]: On Sale
          - 'button "Sort By: Relevance" [ref=e243] [cursor=pointer]':
            - generic [ref=e244]: "Sort By:"
            - generic [ref=e245]: Relevance
            - img [ref=e246]
      - generic [ref=e248]:
        - generic [ref=e249]:
          - generic [ref=e252]: 527 results found
          - generic [ref=e253]:
            - button "View:" [ref=e254] [cursor=pointer]:
              - generic [ref=e255]: "View:"
              - img [ref=e256]
            - 'button "Sort By: Relevance" [ref=e260] [cursor=pointer]':
              - generic [ref=e261]: "Sort By:"
              - generic [ref=e262]: Relevance
              - img [ref=e263]
        - generic [ref=e265]:
          - button "All Filters" [ref=e266] [cursor=pointer]:
            - img [ref=e267]
            - generic [ref=e270]: All Filters
          - generic [ref=e271]:
            - button "Finish Color" [ref=e274] [cursor=pointer]:
              - generic [ref=e275]: Finish Color
              - img [ref=e276]
            - button "Style" [ref=e280] [cursor=pointer]:
              - generic [ref=e281]: Style
              - img [ref=e282]
            - button "Shape" [ref=e286] [cursor=pointer]:
              - generic [ref=e287]: Shape
              - img [ref=e288]
            - button "Price" [ref=e292] [cursor=pointer]:
              - generic [ref=e293]: Price
              - img [ref=e294]
            - button "Brand" [ref=e298] [cursor=pointer]:
              - generic [ref=e299]: Brand
              - img [ref=e300]
        - generic [ref=e302]:
          - generic:
            - list
        - list [ref=e304]:
          - listitem [ref=e305]:
            - article [ref=e306]:
              - generic [ref=e309]:
                - checkbox "Compare" [ref=e310]
                - generic [ref=e311]: Compare
              - generic [ref=e313]:
                - figure [ref=e314]:
                  - link "Planer Medium 36 Inch Rectangular Mirror by Generation - MR1304" [ref=e315] [cursor=pointer]:
                    - /url: /p/planer-medium-36-inch-rectangular-mirror-by-generation-mr1304
                    - img "Planer Medium 36 Inch Rectangular Mirror by Generation - MR1304" [ref=e316]
                - button "Add to Favorites" [ref=e318] [cursor=pointer]:
                  - img [ref=e319]
              - generic [ref=e323]:
                - generic [ref=e324]:
                  - button "Chrome" [ref=e325]
                  - button "Brass" [ref=e326]
                  - button "Black" [ref=e327]
                - generic [ref=e328]: Generation Lighting
                - heading "Planer Medium 36 Inch Rectangular Mirror by Generation - MR1304" [level=2] [ref=e329]:
                  - link "Planer Medium 36 Inch Rectangular Mirror by Generation - MR1304" [ref=e330] [cursor=pointer]:
                    - /url: /p/planer-medium-36-inch-rectangular-mirror-by-generation-mr1304
                    - generic [ref=e331]: Planer Medium 36 Inch Rectangular Mirror by Generation - MR1304
                - generic [ref=e334]: $292.00
                - generic [ref=e335]: 3 Day Delivery or Get $50 Back
          - listitem [ref=e336]:
            - article [ref=e337]:
              - generic [ref=e340]:
                - checkbox "Compare" [ref=e341]
                - generic [ref=e342]: Compare
              - generic [ref=e344]:
                - figure [ref=e345]:
                  - link "Planer Large Rectangular Mirror 48 Inch Tall and 36 Inch Wide by Generation - MR1305" [ref=e346] [cursor=pointer]:
                    - /url: /p/planer-large-rectangular-mirror-48-inch-tall-and-36-inch-wide-by-generation-mr1305
                    - img "Planer Large Rectangular Mirror 48 Inch Tall and 36 Inch Wide by Generation - MR1305" [ref=e347]
                - button "Add to Favorites" [ref=e349] [cursor=pointer]:
                  - img [ref=e350]
              - generic [ref=e354]:
                - generic [ref=e355]:
                  - button "Black" [ref=e356]
                  - button "Brass" [ref=e357]
                  - button "Chrome" [ref=e358]
                - generic [ref=e359]: Generation Lighting
                - heading "Planer Large Rectangular Mirror 48 Inch Tall and 36 Inch Wide by Generation - MR1305" [level=2] [ref=e360]:
                  - link "Planer Large Rectangular Mirror 48 Inch Tall and 36 Inch Wide by Generation - MR1305" [ref=e361] [cursor=pointer]:
                    - /url: /p/planer-large-rectangular-mirror-48-inch-tall-and-36-inch-wide-by-generation-mr1305
                    - generic [ref=e362]: Planer Large Rectangular Mirror 48 Inch Tall and 36 Inch Wide by Generation - MR1305
                - generic [ref=e365]: $524.00
                - generic [ref=e366]: 3 Day Delivery or Get $50 Back
          - listitem [ref=e367]:
            - article [ref=e368]:
              - generic [ref=e371]:
                - checkbox "Compare" [ref=e372]
                - generic [ref=e373]: Compare
              - generic [ref=e375]:
                - figure [ref=e376]:
                  - link "Planer Wide Mirror 36 Inch Tall and 42 Inch Wide by Generation - MR1306" [ref=e377] [cursor=pointer]:
                    - /url: /p/planer-wide-mirror-36-inch-tall-and-42-inch-wide-by-generation-mr1306
                    - img "Planer Wide Mirror 36 Inch Tall and 42 Inch Wide by Generation - MR1306" [ref=e378]
                - button "Add to Favorites" [ref=e380] [cursor=pointer]:
                  - img [ref=e381]
              - generic [ref=e385]:
                - generic [ref=e386]:
                  - button "Brass" [ref=e387]
                  - button "Chrome" [ref=e388]
                  - button "Black" [ref=e389]
                - generic [ref=e390]: Generation Lighting
                - heading "Planer Wide Mirror 36 Inch Tall and 42 Inch Wide by Generation - MR1306" [level=2] [ref=e391]:
                  - link "Planer Wide Mirror 36 Inch Tall and 42 Inch Wide by Generation - MR1306" [ref=e392] [cursor=pointer]:
                    - /url: /p/planer-wide-mirror-36-inch-tall-and-42-inch-wide-by-generation-mr1306
                    - generic [ref=e393]: Planer Wide Mirror 36 Inch Tall and 42 Inch Wide by Generation - MR1306
                - generic [ref=e396]: $450.00
                - generic [ref=e397]: 3 Day Delivery or Get $50 Back
          - listitem [ref=e398]:
            - article [ref=e399]:
              - generic [ref=e400]:
                - generic [ref=e402]:
                  - checkbox "Compare" [ref=e403]
                  - generic [ref=e404]: Compare
                - img "Damp Rated" [ref=e406]
              - generic [ref=e408]:
                - figure [ref=e409]:
                  - link "Cadre 39W 1 LED Round Framed Mirror 36 Inch and 36 Inch Wide by Generation - MREL1431" [ref=e410] [cursor=pointer]:
                    - /url: /p/cadre-39w-1-led-round-framed-mirror-36-inch-and-36-inch-wide-by-generation-mrel1431
                    - img "Cadre 39W 1 LED Round Framed Mirror 36 Inch and 36 Inch Wide by Generation - MREL1431" [ref=e411]
                - button "Add to Favorites" [ref=e413] [cursor=pointer]:
                  - img [ref=e414]
              - generic [ref=e418]:
                - generic [ref=e419]:
                  - button "Black" [ref=e420]
                  - button "Brass" [ref=e421]
                  - button "Chrome" [ref=e422]
                  - button "Nickel/Silver" [ref=e423]
                - generic [ref=e424]: Generation Lighting
                - heading "Cadre 39W 1 LED Round Framed Mirror 36 Inch and 36 Inch Wide by Generation - MREL1431" [level=2] [ref=e425]:
                  - link "Cadre 39W 1 LED Round Framed Mirror 36 Inch and 36 Inch Wide by Generation - MREL1431" [ref=e426] [cursor=pointer]:
                    - /url: /p/cadre-39w-1-led-round-framed-mirror-36-inch-and-36-inch-wide-by-generation-mrel1431
                    - generic [ref=e427]: Cadre 39W 1 LED Round Framed Mirror 36 Inch and 36 Inch Wide by Generation - MREL1431
                - generic [ref=e430]: $479.00
                - generic [ref=e431]: 3 Day Delivery or Get $50 Back
          - listitem [ref=e432]:
            - article [ref=e433]:
              - generic [ref=e434]:
                - generic [ref=e436]:
                  - checkbox "Compare" [ref=e437]
                  - generic [ref=e438]: Compare
                - img "Damp Rated" [ref=e440]
              - generic [ref=e442]:
                - figure [ref=e443]:
                  - link "Mera 30W 1 LED Round Frameless Anti Fog Mirror 30 Inch Tall by Generation - MRIL1420" [ref=e444] [cursor=pointer]:
                    - /url: /p/mera-30w-1-led-round-frameless-anti-fog-mirror-30-inch-tall-by-generation-mril1420
                    - img "Mera 30W 1 LED Round Frameless Anti Fog Mirror 30 Inch Tall by Generation - MRIL1420" [ref=e445]
                - button "Add to Favorites" [ref=e447] [cursor=pointer]:
                  - img [ref=e448]
              - generic [ref=e452]:
                - generic [ref=e454]: Generation Lighting
                - heading "Mera 30W 1 LED Round Frameless Anti Fog Mirror 30 Inch Tall by Generation - MRIL1420" [level=2] [ref=e455]:
                  - link "Mera 30W 1 LED Round Frameless Anti Fog Mirror 30 Inch Tall by Generation - MRIL1420" [ref=e456] [cursor=pointer]:
                    - /url: /p/mera-30w-1-led-round-frameless-anti-fog-mirror-30-inch-tall-by-generation-mril1420
                    - generic [ref=e457]: Mera 30W 1 LED Round Frameless Anti Fog Mirror 30 Inch Tall by Generation - MRIL1420
                - generic [ref=e460]: $367.00
          - listitem [ref=e461]:
            - article [ref=e462]:
              - generic [ref=e463]:
                - generic [ref=e465]:
                  - checkbox "Compare" [ref=e466]
                  - generic [ref=e467]: Compare
                - generic [ref=e468]:
                  - img "Damp Rated" [ref=e469]
                  - generic [ref=e470]:
                    - img [ref=e471]
                    - generic [ref=e473]: Sale
              - generic [ref=e475]:
                - figure [ref=e476]:
                  - link "Lumo 18W 1 LED Rectangular Mirror 32 Inch Tall and 24 Inch Wide by Eurofase - 48104-012" [ref=e477] [cursor=pointer]:
                    - /url: /p/lumo-18w-1-led-rectangular-mirror-32-inches-tall-and-24-inches-wide-48104-012
                    - img "Lumo 18W 1 LED Rectangular Mirror 32 Inch Tall and 24 Inch Wide by Eurofase - 48104-012" [ref=e478]
                - button "Add to Favorites" [ref=e480] [cursor=pointer]:
                  - img [ref=e481]
              - generic [ref=e485]:
                - generic [ref=e487]: Eurofase Lighting
                - heading "Lumo 18W 1 LED Rectangular Mirror 32 Inch Tall and 24 Inch Wide by Eurofase - 48104-012" [level=2] [ref=e488]:
                  - link "Lumo 18W 1 LED Rectangular Mirror 32 Inch Tall and 24 Inch Wide by Eurofase - 48104-012" [ref=e489] [cursor=pointer]:
                    - /url: /p/lumo-18w-1-led-rectangular-mirror-32-inches-tall-and-24-inches-wide-48104-012
                    - generic [ref=e490]: Lumo 18W 1 LED Rectangular Mirror 32 Inch Tall and 24 Inch Wide by Eurofase - 48104-012
                - generic [ref=e492]:
                  - generic [ref=e493]: $500.80
                  - generic [ref=e494]: $626.00
                  - strong [ref=e495]: Save 20%
          - listitem [ref=e496]:
            - article [ref=e497]:
              - generic [ref=e498]:
                - generic [ref=e500]:
                  - checkbox "Compare" [ref=e501]
                  - generic [ref=e502]: Compare
                - generic [ref=e504]:
                  - img [ref=e505]
                  - generic [ref=e507]: Sale
              - generic [ref=e509]:
                - figure [ref=e510]:
                  - link "Teddy 31.75 Inch Wall Mirror In Modern and Contemporary Style by ELK Home - S0036-10145" [ref=e511] [cursor=pointer]:
                    - /url: /p/teddy-wall-mirror-in-modern-and-contemporary-style-31-75-inches-tall-and-22-25-inches-wide-s0036-10145
                    - img "Teddy 31.75 Inch Wall Mirror In Modern and Contemporary Style by ELK Home - S0036-10145" [ref=e512]
                - button "Add to Favorites" [ref=e514] [cursor=pointer]:
                  - img [ref=e515]
              - generic [ref=e519]:
                - generic [ref=e521]: ELK Home
                - heading "Teddy 31.75 Inch Wall Mirror In Modern and Contemporary Style by ELK Home - S0036-10145" [level=2] [ref=e522]:
                  - link "Teddy 31.75 Inch Wall Mirror In Modern and Contemporary Style by ELK Home - S0036-10145" [ref=e523] [cursor=pointer]:
                    - /url: /p/teddy-wall-mirror-in-modern-and-contemporary-style-31-75-inches-tall-and-22-25-inches-wide-s0036-10145
                    - generic [ref=e524]: Teddy 31.75 Inch Wall Mirror In Modern and Contemporary Style by ELK Home - S0036-10145
                - generic [ref=e526]:
                  - generic [ref=e527]: $253.30
                  - generic [ref=e528]: $298.00
                  - strong [ref=e529]: Save 15%
          - listitem [ref=e530]:
            - article [ref=e531]:
              - generic [ref=e532]:
                - generic [ref=e534]:
                  - checkbox "Compare" [ref=e535]
                  - generic [ref=e536]: Compare
                - generic [ref=e538]:
                  - img [ref=e539]
                  - generic [ref=e541]: Sale
              - generic [ref=e543]:
                - figure [ref=e544]:
                  - link "Middleton Wall Mirror 31.75 Inch Tall and 22.75 Inch Wide by ELK Home - S0036-11290" [ref=e545] [cursor=pointer]:
                    - /url: /p/middleton-wall-mirror-in-contemporary-style-31-75-inches-tall-and-22-75-inches-wide-s0036-11290
                    - img "Middleton Wall Mirror 31.75 Inch Tall and 22.75 Inch Wide by ELK Home - S0036-11290" [ref=e546]
                - button "Add to Favorites" [ref=e548] [cursor=pointer]:
                  - img [ref=e549]
              - generic [ref=e553]:
                - generic [ref=e555]: ELK Home
                - heading "Middleton Wall Mirror 31.75 Inch Tall and 22.75 Inch Wide by ELK Home - S0036-11290" [level=2] [ref=e556]:
                  - link "Middleton Wall Mirror 31.75 Inch Tall and 22.75 Inch Wide by ELK Home - S0036-11290" [ref=e557] [cursor=pointer]:
                    - /url: /p/middleton-wall-mirror-in-contemporary-style-31-75-inches-tall-and-22-75-inches-wide-s0036-11290
                    - generic [ref=e558]: Middleton Wall Mirror 31.75 Inch Tall and 22.75 Inch Wide by ELK Home - S0036-11290
                - generic [ref=e560]:
                  - generic [ref=e561]: $202.30
                  - generic [ref=e562]: $238.00
                  - strong [ref=e563]: Save 15%
          - listitem [ref=e564]:
            - article [ref=e565]:
              - generic [ref=e566]:
                - generic [ref=e568]:
                  - checkbox "Compare" [ref=e569]
                  - generic [ref=e570]: Compare
                - img "Damp Rated" [ref=e572]
              - generic [ref=e574]:
                - figure [ref=e575]:
                  - link "36W 1 LED Large Back Lit Mirror 55 Inch Wide By 35.5 Inch High by Eurofase - 29107-018" [ref=e576] [cursor=pointer]:
                    - /url: /p/36w-1-led-large-back-lit-mirror-55-inches-wide-by-35-5-inches-high-29107-018
                    - img "36W 1 LED Large Back Lit Mirror 55 Inch Wide By 35.5 Inch High by Eurofase - 29107-018" [ref=e577]
                - button "Add to Favorites" [ref=e579] [cursor=pointer]:
                  - img [ref=e580]
              - generic [ref=e584]:
                - generic [ref=e586]: Eurofase Lighting
                - heading "36W 1 LED Large Back Lit Mirror 55 Inch Wide By 35.5 Inch High by Eurofase - 29107-018" [level=2] [ref=e587]:
                  - link "36W 1 LED Large Back Lit Mirror 55 Inch Wide By 35.5 Inch High by Eurofase - 29107-018" [ref=e588] [cursor=pointer]:
                    - /url: /p/36w-1-led-large-back-lit-mirror-55-inches-wide-by-35-5-inches-high-29107-018
                    - generic [ref=e589]: 36W 1 LED Large Back Lit Mirror 55 Inch Wide By 35.5 Inch High by Eurofase - 29107-018
                - generic [ref=e592]: $1,507.00
          - listitem [ref=e593]:
            - article [ref=e594]:
              - generic [ref=e595]:
                - generic [ref=e597]:
                  - checkbox "Compare" [ref=e598]
                  - generic [ref=e599]: Compare
                - generic [ref=e601]:
                  - img [ref=e602]
                  - generic [ref=e604]: Sale
              - generic [ref=e606]:
                - figure [ref=e607]:
                  - link "Lexicon 16 Inch Wall Mirror by Varaluz - 446MI16MB" [ref=e608] [cursor=pointer]:
                    - /url: /p/lexicon-wall-mirror-in-modern-style-16-inches-tall-and-16-inches-wide-446mi16mb
                    - img "Lexicon 16 Inch Wall Mirror by Varaluz - 446MI16MB" [ref=e609]
                - button "Add to Favorites" [ref=e611] [cursor=pointer]:
                  - img [ref=e612]
              - generic [ref=e616]:
                - generic [ref=e618]: Varaluz Lighting
                - heading "Lexicon 16 Inch Wall Mirror by Varaluz - 446MI16MB" [level=2] [ref=e619]:
                  - link "Lexicon 16 Inch Wall Mirror by Varaluz - 446MI16MB" [ref=e620] [cursor=pointer]:
                    - /url: /p/lexicon-wall-mirror-in-modern-style-16-inches-tall-and-16-inches-wide-446mi16mb
                    - generic [ref=e621]: Lexicon 16 Inch Wall Mirror by Varaluz - 446MI16MB
                - generic [ref=e623]:
                  - generic [ref=e624]: $262.65
                  - generic [ref=e625]: $309.00
                  - strong [ref=e626]: Save 15%
          - listitem [ref=e627]:
            - article [ref=e628]:
              - generic [ref=e629]:
                - generic [ref=e631]:
                  - checkbox "Compare" [ref=e632]
                  - generic [ref=e633]: Compare
                - generic [ref=e635]:
                  - img [ref=e636]
                  - generic [ref=e638]: Sale
              - generic [ref=e640]:
                - figure [ref=e641]:
                  - link "Lexicon 42 Inch Wall Mirror by Varaluz - 446MI42MB" [ref=e642] [cursor=pointer]:
                    - /url: /p/lexicon-wall-mirror-in-modern-style-42-inches-tall-and-42-inches-wide-446mi42mb
                    - img "Lexicon 42 Inch Wall Mirror by Varaluz - 446MI42MB" [ref=e643]
                - button "Add to Favorites" [ref=e645] [cursor=pointer]:
                  - img [ref=e646]
              - generic [ref=e650]:
                - generic [ref=e652]: Varaluz Lighting
                - heading "Lexicon 42 Inch Wall Mirror by Varaluz - 446MI42MB" [level=2] [ref=e653]:
                  - link "Lexicon 42 Inch Wall Mirror by Varaluz - 446MI42MB" [ref=e654] [cursor=pointer]:
                    - /url: /p/lexicon-wall-mirror-in-modern-style-42-inches-tall-and-42-inches-wide-446mi42mb
                    - generic [ref=e655]: Lexicon 42 Inch Wall Mirror by Varaluz - 446MI42MB
                - generic [ref=e657]:
                  - generic [ref=e658]: $747.15
                  - generic [ref=e659]: $879.00
                  - strong [ref=e660]: Save 15%
          - listitem [ref=e661]:
            - article [ref=e662]:
              - generic [ref=e663]:
                - generic [ref=e665]:
                  - checkbox "Compare" [ref=e666]
                  - generic [ref=e667]: Compare
                - generic [ref=e669]:
                  - img [ref=e670]
                  - generic [ref=e672]: Sale
              - generic [ref=e674]:
                - figure [ref=e675]:
                  - link "The Fun Trap 40 Inch BeveLED Wall Mirror In Modern Style by Varaluz - 443MI22" [ref=e676] [cursor=pointer]:
                    - /url: /p/the-fun-trap-beveled-wall-mirror-in-modern-style-40-inches-tall-and-22-inches-wide-443mi22
                    - img "The Fun Trap 40 Inch BeveLED Wall Mirror In Modern Style by Varaluz - 443MI22" [ref=e677]
                - button "Add to Favorites" [ref=e679] [cursor=pointer]:
                  - img [ref=e680]
              - generic [ref=e684]:
                - generic [ref=e685]:
                  - button "Black" [ref=e686]
                  - button "Gold" [ref=e687]
                - generic [ref=e688]: Varaluz Lighting
                - heading "The Fun Trap 40 Inch BeveLED Wall Mirror In Modern Style by Varaluz - 443MI22" [level=2] [ref=e689]:
                  - link "The Fun Trap 40 Inch BeveLED Wall Mirror In Modern Style by Varaluz - 443MI22" [ref=e690] [cursor=pointer]:
                    - /url: /p/the-fun-trap-beveled-wall-mirror-in-modern-style-40-inches-tall-and-22-inches-wide-443mi22
                    - generic [ref=e691]: The Fun Trap 40 Inch BeveLED Wall Mirror In Modern Style by Varaluz - 443MI22
                - generic [ref=e692]:
                  - generic [ref=e693]:
                    - generic [ref=e694]: $183.60
                    - generic [ref=e695]: $459.00
                    - strong [ref=e696]: Save 60%
                  - generic [ref=e697]: Clearance
          - listitem [ref=e698]:
            - article [ref=e699]:
              - generic [ref=e700]:
                - generic [ref=e702]:
                  - checkbox "Compare" [ref=e703]
                  - generic [ref=e704]: Compare
                - generic [ref=e706]:
                  - img [ref=e707]
                  - generic [ref=e709]: Sale
              - generic [ref=e711]:
                - figure [ref=e712]:
                  - link "Decanter Wall Mirror 40 Inch Tall and 14 Inch Wide by Varaluz - 442MI14" [ref=e713] [cursor=pointer]:
                    - /url: /p/decanter-wall-mirror-in-modern-style-40-inches-tall-and-14-inches-wide-442mi14
                    - img "Decanter Wall Mirror 40 Inch Tall and 14 Inch Wide by Varaluz - 442MI14" [ref=e714]
                - button "Add to Favorites" [ref=e716] [cursor=pointer]:
                  - img [ref=e717]
              - generic [ref=e721]:
                - generic [ref=e722]:
                  - button "Black" [ref=e723]
                  - button "Gold" [ref=e724]
                - generic [ref=e725]: Varaluz Lighting
                - heading "Decanter Wall Mirror 40 Inch Tall and 14 Inch Wide by Varaluz - 442MI14" [level=2] [ref=e726]:
                  - link "Decanter Wall Mirror 40 Inch Tall and 14 Inch Wide by Varaluz - 442MI14" [ref=e727] [cursor=pointer]:
                    - /url: /p/decanter-wall-mirror-in-modern-style-40-inches-tall-and-14-inches-wide-442mi14
                    - generic [ref=e728]: Decanter Wall Mirror 40 Inch Tall and 14 Inch Wide by Varaluz - 442MI14
                - generic [ref=e729]:
                  - generic [ref=e730]:
                    - generic [ref=e731]: $143.60
                    - generic [ref=e732]: $359.00
                    - strong [ref=e733]: Save 60%
                  - generic [ref=e734]: Clearance
          - listitem [ref=e735]:
            - article [ref=e736]:
              - generic [ref=e737]:
                - generic [ref=e739]:
                  - checkbox "Compare" [ref=e740]
                  - generic [ref=e741]: Compare
                - generic [ref=e743]:
                  - img [ref=e744]
                  - generic [ref=e746]: Sale
              - generic [ref=e748]:
                - figure [ref=e749]:
                  - link "Shield Your Eyes 33.5 Inch Wall Mirror by Varaluz - 441MI24" [ref=e750] [cursor=pointer]:
                    - /url: /p/shield-your-eyes-wall-mirror-in-modern-style-33-5-inches-tall-and-24-inches-wide-441mi24
                    - img "Shield Your Eyes 33.5 Inch Wall Mirror by Varaluz - 441MI24" [ref=e751]
                - button "Add to Favorites" [ref=e753] [cursor=pointer]:
                  - img [ref=e754]
              - generic [ref=e758]:
                - generic [ref=e759]:
                  - button "Black" [ref=e760]
                  - button "Gold" [ref=e761]
                - generic [ref=e762]: Varaluz Lighting
                - heading "Shield Your Eyes 33.5 Inch Wall Mirror by Varaluz - 441MI24" [level=2] [ref=e763]:
                  - link "Shield Your Eyes 33.5 Inch Wall Mirror by Varaluz - 441MI24" [ref=e764] [cursor=pointer]:
                    - /url: /p/shield-your-eyes-wall-mirror-in-modern-style-33-5-inches-tall-and-24-inches-wide-441mi24
                    - generic [ref=e765]: Shield Your Eyes 33.5 Inch Wall Mirror by Varaluz - 441MI24
                - generic [ref=e767]:
                  - generic [ref=e768]: $390.15
                  - generic [ref=e769]: $459.00
                  - strong [ref=e770]: Save 15%
          - listitem [ref=e771]:
            - article [ref=e772]:
              - generic [ref=e773]:
                - generic [ref=e775]:
                  - checkbox "Compare" [ref=e776]
                  - generic [ref=e777]: Compare
                - generic [ref=e779]:
                  - img [ref=e780]
                  - generic [ref=e782]: Sale
              - generic [ref=e784]:
                - figure [ref=e785]:
                  - link "Who Do Ya Love 30 Inch Wall Mirror In Modern Style by Varaluz - 440MI30" [ref=e786] [cursor=pointer]:
                    - /url: /p/who-do-ya-love-wall-mirror-in-modern-style-30-inches-tall-and-30-inches-wide-440mi30
                    - img "Who Do Ya Love 30 Inch Wall Mirror In Modern Style by Varaluz - 440MI30" [ref=e787]
                - button "Add to Favorites" [ref=e789] [cursor=pointer]:
                  - img [ref=e790]
              - generic [ref=e794]:
                - generic [ref=e795]:
                  - button "Black" [ref=e796]
                  - button "Gold" [ref=e797]
                - generic [ref=e798]: Varaluz Lighting
                - heading "Who Do Ya Love 30 Inch Wall Mirror In Modern Style by Varaluz - 440MI30" [level=2] [ref=e799]:
                  - link "Who Do Ya Love 30 Inch Wall Mirror In Modern Style by Varaluz - 440MI30" [ref=e800] [cursor=pointer]:
                    - /url: /p/who-do-ya-love-wall-mirror-in-modern-style-30-inches-tall-and-30-inches-wide-440mi30
                    - generic [ref=e801]: Who Do Ya Love 30 Inch Wall Mirror In Modern Style by Varaluz - 440MI30
                - generic [ref=e803]:
                  - generic [ref=e804]: $347.65
                  - generic [ref=e805]: $409.00
                  - strong [ref=e806]: Save 15%
          - listitem [ref=e807]:
            - article [ref=e808]:
              - generic [ref=e809]:
                - generic [ref=e811]:
                  - checkbox "Compare" [ref=e812]
                  - generic [ref=e813]: Compare
                - generic [ref=e815]:
                  - img [ref=e816]
                  - generic [ref=e818]: Sale
              - generic [ref=e820]:
                - figure [ref=e821]:
                  - link "Pointless Exclamation 40 Inch Wall Mirror by Varaluz - 437MI21" [ref=e822] [cursor=pointer]:
                    - /url: /p/pointless-exclamation-wall-mirror-in-modern-style-40-inches-tall-and-21-25-inches-wide-437mi21
                    - img "Pointless Exclamation 40 Inch Wall Mirror by Varaluz - 437MI21" [ref=e823]
                - button "Add to Favorites" [ref=e825] [cursor=pointer]:
                  - img [ref=e826]
              - generic [ref=e830]:
                - generic [ref=e831]:
                  - button "Black" [ref=e832]
                  - button "Chrome" [ref=e833]
                  - button "Gold" [ref=e834]
                - generic [ref=e835]: Varaluz Lighting
                - heading "Pointless Exclamation 40 Inch Wall Mirror by Varaluz - 437MI21" [level=2] [ref=e836]:
                  - link "Pointless Exclamation 40 Inch Wall Mirror by Varaluz - 437MI21" [ref=e837] [cursor=pointer]:
                    - /url: /p/pointless-exclamation-wall-mirror-in-modern-style-40-inches-tall-and-21-25-inches-wide-437mi21
                    - generic [ref=e838]: Pointless Exclamation 40 Inch Wall Mirror by Varaluz - 437MI21
                - generic [ref=e840]:
                  - generic [ref=e841]: $347.65
                  - generic [ref=e842]: $409.00
                  - strong [ref=e843]: Save 15%
          - listitem [ref=e844]:
            - article [ref=e845]:
              - generic [ref=e846]:
                - generic [ref=e848]:
                  - checkbox "Compare" [ref=e849]
                  - generic [ref=e850]: Compare
                - generic [ref=e852]:
                  - img [ref=e853]
                  - generic [ref=e855]: Sale
              - generic [ref=e857]:
                - figure [ref=e858]:
                  - link "Put A Spell On You 30 Inch Wall Mirror by Varaluz - 436MI30" [ref=e859] [cursor=pointer]:
                    - /url: /p/put-a-spell-on-you-wall-mirror-in-modern-style-30-inches-tall-and-30-inches-wide-436mi30
                    - img "Put A Spell On You 30 Inch Wall Mirror by Varaluz - 436MI30" [ref=e860]
                - button "Add to Favorites" [ref=e862] [cursor=pointer]:
                  - img [ref=e863]
              - generic [ref=e867]:
                - generic [ref=e868]:
                  - button "Black" [ref=e869]
                  - button "Chrome" [ref=e870]
                  - button "Gold" [ref=e871]
                - generic [ref=e872]: Varaluz Lighting
                - heading "Put A Spell On You 30 Inch Wall Mirror by Varaluz - 436MI30" [level=2] [ref=e873]:
                  - link "Put A Spell On You 30 Inch Wall Mirror by Varaluz - 436MI30" [ref=e874] [cursor=pointer]:
                    - /url: /p/put-a-spell-on-you-wall-mirror-in-modern-style-30-inches-tall-and-30-inches-wide-436mi30
                    - generic [ref=e875]: Put A Spell On You 30 Inch Wall Mirror by Varaluz - 436MI30
                - generic [ref=e876]:
                  - generic [ref=e877]:
                    - generic [ref=e878]: $143.60
                    - generic [ref=e879]: $359.00
                    - strong [ref=e880]: Save 60%
                  - generic [ref=e881]: Clearance
          - listitem [ref=e882]:
            - article [ref=e883]:
              - generic [ref=e884]:
                - generic [ref=e886]:
                  - checkbox "Compare" [ref=e887]
                  - generic [ref=e888]: Compare
                - generic [ref=e890]:
                  - img [ref=e891]
                  - generic [ref=e893]: Sale
              - generic [ref=e895]:
                - figure [ref=e896]:
                  - link "Put A Spell On You 60 Inch Wall Mirror by Varaluz - 436MI24" [ref=e897] [cursor=pointer]:
                    - /url: /p/put-a-spell-on-you-wall-mirror-in-modern-style-60-inches-tall-and-24-inches-wide-436mi24
                    - img "Put A Spell On You 60 Inch Wall Mirror by Varaluz - 436MI24" [ref=e898]
                - button "Add to Favorites" [ref=e900] [cursor=pointer]:
                  - img [ref=e901]
              - generic [ref=e905]:
                - generic [ref=e906]:
                  - button "Black" [ref=e907]
                  - button "Chrome" [ref=e908]
                  - button "Gold" [ref=e909]
                - generic [ref=e910]: Varaluz Lighting
                - heading "Put A Spell On You 60 Inch Wall Mirror by Varaluz - 436MI24" [level=2] [ref=e911]:
                  - link "Put A Spell On You 60 Inch Wall Mirror by Varaluz - 436MI24" [ref=e912] [cursor=pointer]:
                    - /url: /p/put-a-spell-on-you-wall-mirror-in-modern-style-60-inches-tall-and-24-inches-wide-436mi24
                    - generic [ref=e913]: Put A Spell On You 60 Inch Wall Mirror by Varaluz - 436MI24
                - generic [ref=e914]:
                  - generic [ref=e915]:
                    - generic [ref=e916]: $227.60
                    - generic [ref=e917]: $569.00
                    - strong [ref=e918]: Save 60%
                  - generic [ref=e919]: Clearance
          - listitem [ref=e920]:
            - article [ref=e921]:
              - generic [ref=e922]:
                - generic [ref=e924]:
                  - checkbox "Compare" [ref=e925]
                  - generic [ref=e926]: Compare
                - generic [ref=e928]:
                  - img [ref=e929]
                  - generic [ref=e931]: Sale
              - generic [ref=e933]:
                - figure [ref=e934]:
                  - link "Out For A Ride 44 Inch Wall Mirror by Varaluz - 407MI10MBHG" [ref=e935] [cursor=pointer]:
                    - /url: /p/out-for-a-ride-wall-mirror-in-modern-style-39-inches-tall-and-44-inches-wide-407mi10mbhg
                    - img "Out For A Ride 44 Inch Wall Mirror by Varaluz - 407MI10MBHG" [ref=e936]
                - button "Add to Favorites" [ref=e938] [cursor=pointer]:
                  - img [ref=e939]
              - generic [ref=e943]:
                - generic [ref=e945]: Varaluz Lighting
                - heading "Out For A Ride 44 Inch Wall Mirror by Varaluz - 407MI10MBHG" [level=2] [ref=e946]:
                  - link "Out For A Ride 44 Inch Wall Mirror by Varaluz - 407MI10MBHG" [ref=e947] [cursor=pointer]:
                    - /url: /p/out-for-a-ride-wall-mirror-in-modern-style-39-inches-tall-and-44-inches-wide-407mi10mbhg
                    - generic [ref=e948]: Out For A Ride 44 Inch Wall Mirror by Varaluz - 407MI10MBHG
                - generic [ref=e950]:
                  - generic [ref=e951]: $1,095.65
                  - generic [ref=e952]: $1,289.00
                  - strong [ref=e953]: Save 15%
          - listitem [ref=e954]:
            - article [ref=e955]:
              - generic [ref=e956]:
                - generic [ref=e958]:
                  - checkbox "Compare" [ref=e959]
                  - generic [ref=e960]: Compare
                - generic [ref=e962]:
                  - img [ref=e963]
                  - generic [ref=e965]: Sale
              - generic [ref=e967]:
                - figure [ref=e968]:
                  - link "Loving Hands Wall Mirror 24 Inch Tall and 60 Inch Wide by Varaluz - 407MI09MBFG" [ref=e969] [cursor=pointer]:
                    - /url: /p/loving-hands-wall-mirror-24-inches-tall-and-60-inches-wide-407mi09mbfg
                    - img "Loving Hands Wall Mirror 24 Inch Tall and 60 Inch Wide by Varaluz - 407MI09MBFG" [ref=e970]
                - button "Add to Favorites" [ref=e972] [cursor=pointer]:
                  - img [ref=e973]
              - generic [ref=e977]:
                - generic [ref=e979]: Varaluz Lighting
                - heading "Loving Hands Wall Mirror 24 Inch Tall and 60 Inch Wide by Varaluz - 407MI09MBFG" [level=2] [ref=e980]:
                  - link "Loving Hands Wall Mirror 24 Inch Tall and 60 Inch Wide by Varaluz - 407MI09MBFG" [ref=e981] [cursor=pointer]:
                    - /url: /p/loving-hands-wall-mirror-24-inches-tall-and-60-inches-wide-407mi09mbfg
                    - generic [ref=e982]: Loving Hands Wall Mirror 24 Inch Tall and 60 Inch Wide by Varaluz - 407MI09MBFG
                - generic [ref=e984]:
                  - generic [ref=e985]: $1,095.65
                  - generic [ref=e986]: $1,289.00
                  - strong [ref=e987]: Save 15%
        - generic [ref=e988]:
          - list [ref=e990]:
            - listitem [ref=e991]:
              - link "Page 1" [ref=e992] [cursor=pointer]:
                - /url: /c/chandeliers?page=1
                - text: "1"
            - listitem [ref=e993]:
              - link "Page 2" [ref=e994] [cursor=pointer]:
                - /url: /c/chandeliers?page=2
                - text: "2"
            - listitem [ref=e995]:
              - link "Page 3" [ref=e996] [cursor=pointer]:
                - /url: /c/chandeliers?page=3
                - text: "3"
            - listitem [ref=e997]:
              - link "Page 4" [ref=e998] [cursor=pointer]:
                - /url: /c/chandeliers?page=4
                - text: "4"
            - listitem [ref=e999]:
              - link "Page 5" [ref=e1000] [cursor=pointer]:
                - /url: /c/chandeliers?page=5
                - text: "5"
            - listitem [ref=e1001]: …
            - listitem [ref=e1002]:
              - link "Last Page" [ref=e1003] [cursor=pointer]:
                - /url: /c/chandeliers?page=27
                - generic [ref=e1004]: "27"
            - listitem [ref=e1005]:
              - link "Next Page" [ref=e1006] [cursor=pointer]:
                - /url: /c/chandeliers?page=2
                - img [ref=e1008]
          - generic [ref=e1010]:
            - generic [ref=e1012]: 527 results found
            - button "20" [ref=e1015] [cursor=pointer]:
              - generic [ref=e1016]: "20"
              - img [ref=e1017]
  - link [ref=e1020] [cursor=pointer]:
    - /url: http://www.1stoplighting.com
    - img [ref=e1021]
  - contentinfo [ref=e1022]:
    - generic [ref=e1023]:
      - generic [ref=e1024]:
        - generic [ref=e1025]:
          - generic [ref=e1026]: Customer Service
          - generic [ref=e1027]:
            - link "Help Center" [ref=e1028] [cursor=pointer]:
              - /url: /content/help-center
              - generic [ref=e1029]: Help Center
            - link "Returns" [ref=e1030] [cursor=pointer]:
              - /url: /content/returns
              - generic [ref=e1031]: Returns
            - link "Replacements" [ref=e1032] [cursor=pointer]:
              - /url: /content/replacements
              - generic [ref=e1033]: Replacements
            - link "Shipping" [ref=e1034] [cursor=pointer]:
              - /url: /content/shipping
              - generic [ref=e1035]: Shipping
            - link "View Order Status" [ref=e1036] [cursor=pointer]:
              - /url: /order-tracking
              - generic [ref=e1037]: View Order Status
        - heading "Shopping Assistance" [level=3] [ref=e1039]
      - generic [ref=e1041]:
        - generic [ref=e1042]: Shopping
        - generic [ref=e1043]:
          - link "On Sale" [ref=e1044] [cursor=pointer]:
            - /url: /sale
            - generic [ref=e1045]: On Sale
          - link "Our Brands" [ref=e1046] [cursor=pointer]:
            - /url: /brands
            - generic [ref=e1047]: Our Brands
          - link "B2B and Trade Customers" [ref=e1048] [cursor=pointer]:
            - /url: /trade-account/trade-step1
            - generic [ref=e1049]: B2B and Trade Customers
          - link "View your Cart" [ref=e1050] [cursor=pointer]:
            - /url: /cart
            - generic [ref=e1051]: View your Cart
          - link "Coupon Policy" [ref=e1052] [cursor=pointer]:
            - /url: /content/coupons
            - generic [ref=e1053]: Coupon Policy
      - generic [ref=e1054]:
        - generic [ref=e1055]: About Us
        - generic [ref=e1056]:
          - link "About Us" [ref=e1057] [cursor=pointer]:
            - /url: /content/about-us
            - generic [ref=e1058]: About Us
          - link "Partners" [ref=e1059] [cursor=pointer]:
            - /url: /content/partners
            - generic [ref=e1060]: Partners
          - link "Privacy Policy" [ref=e1061] [cursor=pointer]:
            - /url: /content/privacy-and-security
            - generic [ref=e1062]: Privacy Policy
          - link "Terms of Use" [ref=e1063] [cursor=pointer]:
            - /url: /content/terms-of-use
            - generic [ref=e1064]: Terms of Use
          - link "Accessibility" [ref=e1065] [cursor=pointer]:
            - /url: /content/accessibility-statement
            - generic [ref=e1066]: Accessibility
      - generic [ref=e1068]:
        - generic [ref=e1069]: follow us
        - generic [ref=e1070]:
          - link "Pinterest" [ref=e1071] [cursor=pointer]:
            - /url: https://www.pinterest.com/homeclick/
            - img "Pinterest" [ref=e1072]
          - link "YouTube" [ref=e1074] [cursor=pointer]:
            - /url: https://www.youtube.com/c/Homeclick/videos/
            - img "YouTube" [ref=e1075]
          - link "Instagram" [ref=e1077] [cursor=pointer]:
            - /url: https://www.instagram.com/homeclickdesigns/
            - img "Instagram" [ref=e1078]
          - link "Twitter" [ref=e1080] [cursor=pointer]:
            - /url: https://x.com/homeclick/
            - img "Twitter" [ref=e1081]
          - link "Facebook" [ref=e1083] [cursor=pointer]:
            - /url: https://www.facebook.com/homeclick/
            - img "Facebook" [ref=e1084]
        - navigation [ref=e1087]:
          - generic [ref=e1088]:
            - generic [ref=e1089]:
              - text: "Referrer Id :"
              - generic [ref=e1090]: "#####"
            - generic [ref=e1091] [cursor=pointer]: Agent Login
            - generic [ref=e1092]:
              - generic [ref=e1093]: "Session Id:"
              - generic [ref=e1094]: Click Here
    - generic [ref=e1095]:
      - generic [ref=e1096]: © 2026 Homeclick. All Rights Reserved
      - generic [ref=e1097]:
        - img "payment images" [ref=e1098]
        - img "payment images" [ref=e1099]
        - img "payment images" [ref=e1100]
        - img "payment images" [ref=e1101]
        - img "payment images" [ref=e1102]
        - img "payment images" [ref=e1103]
        - img "payment images" [ref=e1104]
  - alert [ref=e1105]: Wall Mirrors - Homeclick
  - iframe [ref=e1106]:
    - generic [ref=f4e1]:
      - alert [ref=f4e2]: Live chat is available
      - button [ref=f4e6] [cursor=pointer]
  - dialog "Cookie consent button" [ref=e1107] [cursor=pointer]:
    - generic [ref=e1108]: Cookie settings
```

# Test source

```ts
  48  | 
  49  |   const n = await menuLinks.count();
  50  |   for (let i = 0; i < n; i++) {
  51  |     const link = menuLinks.nth(i);
  52  |     if (!(await link.isVisible().catch(() => false))) continue;
  53  |     try {
  54  |       await link.click({ timeout: 12000 });
  55  |       await page.waitForLoadState("domcontentloaded");
  56  |       qaStep(page, `Navigated after "${label}"`);
  57  |       return;
  58  |     } catch (_) {
  59  |       /* next */
  60  |     }
  61  |   }
  62  | 
  63  |   const href =
  64  |     (await visible.first().getAttribute("href").catch(() => null)) ||
  65  |     (await menuLinks.first().getAttribute("href").catch(() => null));
  66  |   if (href) {
  67  |     const target = new URL(href, page.url()).toString();
  68  |     qaStep(page, `Opening ${target} (menu link was off-screen)`);
  69  |     await page.goto(target, { waitUntil: "domcontentloaded" });
  70  |     qaStep(page, `Navigated after "${label}"`);
  71  |     return;
  72  |   }
  73  | 
  74  |   await page.evaluate((linkText) => {
  75  |     const re = new RegExp(
  76  |       "^" + String(linkText).replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+") + "$",
  77  |       "i"
  78  |     );
  79  |     for (const a of document.querySelectorAll("a.main-menu-link")) {
  80  |       if (!re.test((a.textContent || "").trim())) continue;
  81  |       const r = a.getBoundingClientRect();
  82  |       if (r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < window.innerHeight) {
  83  |         a.click();
  84  |         return;
  85  |       }
  86  |     }
  87  |     throw new Error("No visible main-menu-link for " + linkText);
  88  |   }, label);
  89  |   await page.waitForLoadState("domcontentloaded");
  90  |   qaStep(page, `Navigated after "${label}" (in-page click)`);
  91  | }
  92  | 
  93  | /** Subcategory / megamenu links (e.g. Wall Mirrors) */
  94  | async function clickCategoryLink(page, label) {
  95  |   await dismissCookieBanner(page);
  96  |   qaStep(page, `Click category: "${label}"`);
  97  |   const escaped = String(label).replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  98  |   const re = new RegExp("^" + escaped + "$", "i");
  99  |   const links = page.getByRole("link", { name: re });
  100 |   const visible = links.filter({ visible: true });
  101 |   if ((await visible.count()) > 0) {
  102 |     await visible.first().click({ timeout: 20000 });
  103 |     await page.waitForLoadState("domcontentloaded");
  104 |     qaStep(page, `Opened category "${label}"`);
  105 |     return;
  106 |   }
  107 |   const href = await links.first().getAttribute("href").catch(() => null);
  108 |   if (href) {
  109 |     const target = new URL(href, page.url()).toString();
  110 |     await page.goto(target, { waitUntil: "domcontentloaded" });
  111 |     qaStep(page, `Opened category "${label}" at ${target}`);
  112 |     return;
  113 |   }
  114 |   await links.first().click({ force: true, timeout: 15000 });
  115 |   qaStep(page, `Opened category "${label}"`);
  116 | }
  117 | 
  118 | const { test, expect } = require('@playwright/test');
  119 | 
  120 | // Helper function to pass Cloudflare/bot checks
  121 | 
  122 | 
  123 | // Helper function for top navigation links
  124 | 
  125 | 
  126 | test("Add to Cart — happy path", async ({ page }) => {
  127 |   // Step 1: Go to the Base URL for this flow
  128 |   // Step 1: Go to the Base URL for this flow
  129 |   await page.goto('https://www.graciousgarage.com');
  130 |   await page.waitForLoadState('domcontentloaded');
  131 |   await waitForStorefront(page);
  132 | 
  133 |   // Step 2: in the top navigation click "Decor"
  134 |   // Step 2: in the top navigation click "Decor"
  135 |   await clickTopNavLink(page, 'Decor');
  136 | 
  137 |   // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
  138 |   // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
  139 |   await page.getByRole('link', { name: 'Mirror' }).first().click(); // Assuming "Mirror" is a submenu item under Decor
  140 |   await page.getByRole('link', { name: 'Wall Mirrors' }).first().click(); // Assuming "Wall Mirrors" is a submenu item under Mirror
  141 | 
  142 |   // Step 4: Click the image of the first product
  143 |   // Step 4: Click the image of the first product
  144 |   await page.getByRole('main').getByRole('link').filter({ has: page.locator('img') }).first().click();
  145 | 
  146 |   // Step 5: Click "Add to Cart" button
  147 |   // Step 5: Click "Add to Cart" button
> 148 |   await page.getByRole('button', { name: /add\s+to\s+cart/i }).first().click();
      |                                                                        ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  149 | 
  150 |   // Step 6: Check Added to Cart! flyout is coming or not
  151 |   // Step 6: Check Added to Cart! flyout is coming or not
  152 |   await expect(page.getByText(/added\s+to\s+cart!?/i)).toBeVisible({ timeout: 15000 });
  153 | });
```