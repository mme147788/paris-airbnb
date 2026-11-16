// DAL for listings - runs the SQL through the pool and returns the rows. No req / res here.
// Always pass values with .input(...) and use @name in the query.
//
// Step 2: getListings({ neighbourhood, roomType, minPrice, maxPrice, orderBy, limit })
//   SELECT TOP (@limit) ... FROM dbo.Paris_Airbnb_listings WHERE price IS NOT NULL ... ORDER BY ...
//   Build the fields in SQL: CONCAT (title), UPPER (propertyType), CAST ... AS INT, ROUND (stars)
//
// Step 3: getListingById(id)
//   DATEADD (hostSince), YEAR (hostSinceYear), DATEDIFF + GETDATE (yearsHosting), LEN (aboutLength)

const { sql, poolPromise } = require("../config/db");

async function getListings({ neighbourhood, roomType, minPrice, maxPrice, orderBy, limit }) {

    const pool = await poolPromise;

    const request = pool.request();

    request.input("limit", sql.Int, limit);
    request.input("neighbourhood", sql.NVarChar, neighbourhood ?? null);
    request.input("roomType", sql.NVarChar, roomType ?? null);
    request.input("minPrice", sql.Money, minPrice ?? null);
    request.input("maxPrice", sql.Money, maxPrice ?? null);


    const query =
        `SELECT TOP (@limit)
        CAST(id AS INT) AS id,
        CONCAT(room_type, ' in ', neighbourhood_cleansed) AS title,
        UPPER(property_type) AS propertyType,
        room_type AS roomType,
        neighbourhood_cleansed AS neighbourhood,
        CAST(price AS INT) AS pricePerNight,
        ROUND(review_scores_rating / 20.0, 1) AS stars,
        CAST(number_of_reviews AS INT) AS reviewsCount,
        CAST(bedrooms AS INT) AS bedrooms,
        CAST(beds AS INT) AS beds,
        CAST(accommodates AS INT) AS accommodates
    FROM dbo.Paris_Airbnb_listings
    WHERE price IS NOT NULL
        AND (@neighbourhood IS NULL OR neighbourhood_cleansed = @neighbourhood)
        AND (@roomType IS NULL OR room_type = @roomType)
        AND (@minPrice IS NULL OR price >= @minPrice)
        AND (@maxPrice IS NULL OR price <= @maxPrice)
        ORDER BY ${orderBy}`

    const result = await request.query(query);
    return result.recordset;
}

async function getListingById(id) {

    const pool = await poolPromise;

    const request = pool.request();

    request.input("id", sql.Int, id)

    const query =
        `SELECT
    CAST(id AS INT) AS id,
    CONCAT(room_type, ' in ', neighbourhood_cleansed) AS title,
    UPPER(property_type) AS propertyType,
    room_type AS roomType,
    neighbourhood_cleansed AS neighbourhood,
    CAST(price AS INT) AS pricePerNight,
    ROUND(review_scores_rating / 20.0, 1) AS stars,
    CAST(number_of_reviews AS INT) AS reviewsCount,
    CAST(bedrooms AS INT) AS bedrooms,
    CAST(beds AS INT) AS beds,
    CAST(accommodates AS INT) AS accommodates,
    CAST(bathrooms AS INT) AS bathrooms,
    latitude,
    longitude,
    CAST(host_id AS INT) AS hostId,
    host_name AS hostName,
    host_is_superhost AS hostIsSuperhost,
    DATEADD(day, host_since - 2, '1900-01-01') AS hostSince,
    YEAR(DATEADD(day, host_since - 2, '1900-01-01')) AS hostSinceYear,
    DATEDIFF(
            year,
            DATEADD(day, host_since - 2, '1900-01-01'),
            GETDATE()
            ) AS yearsHosting,
    host_about AS hostAbout,
    CAST(LEN(host_about) AS INT) AS aboutLength
        FROM dbo.Paris_Airbnb_listings
        WHERE id = @id
        `

    const result = await request.query(query);
    return result.recordset[0];

}


module.exports = { getListings, getListingById };